const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const newsStore = require('./newsStore');

const app = express();
const PORT = process.env.PORT || 8000;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// enable CORS for all origins (adjust in production for security)
app.use(cors({ origin: '*' }));

app.use(session({
  secret: 'change_this_secret_for_prod',
  resave: false,
  saveUninitialized: false,
  rolling: true, // reset cookie on every response (activity)
  cookie: {
    maxAge: 1000 * 60 * 30, // 30 minutes inactivity
    httpOnly: true,
    sameSite: 'lax',
    secure: false
  }
}));

// static
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/images', express.static(path.join(__dirname, '..', 'images')));
app.use('/', express.static(path.join(__dirname, '..'))); // serve site root pages
// serve admin with protection: allow login page/public login route, protect others
const adminDir = path.join(__dirname, '..', 'admin');
app.use('/admin', (req, res, next) => {
  // allow login page and login POST to be public
  if (req.path === '/login.html' || req.path === '/login' || req.path === '/login.js') {
    return express.static(adminDir)(req, res, next);
  }
  // all other admin assets require admin session
  return requireAdmin(req, res, next);
}, express.static(adminDir));

// multer setup for uploads -> public/uploads
const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, uuidv4() + ext);
  }
});
const upload = multer({ storage });

// helper: admin check
function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  // if request for API, return 401
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
  return res.redirect('/admin/login.html');
}

// Admin login/logout
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    req.session.admin = true;
    return res.redirect('/admin/dashboard.html');
  }
  return res.redirect('/admin/login.html?error=1');
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login.html');
  });
});

// PUBLIC API
app.get('/api/news', (req, res) => {
  const items = newsStore.readAll();
  res.json(items);
});

// HOMEPAGE content storage (simple file)
const homeStorePath = path.join(__dirname, '..', 'data', 'homepage.json');
function readHome() {
  try {
    const raw = fs.readFileSync(homeStorePath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    return { intro: '' };
  }
}
function writeHome(obj) {
  fs.writeFileSync(homeStorePath, JSON.stringify(obj, null, 2), 'utf8');
}

// contacts storage
const contactsPath = path.join(__dirname, '..', 'data', 'contacts.json');
function readContacts(){
  try{ const raw = fs.readFileSync(contactsPath,'utf8'); return JSON.parse(raw||'[]'); }catch(e){ return []; }
}
function writeContacts(items){ fs.writeFileSync(contactsPath, JSON.stringify(items,null,2),'utf8'); }

// POST contact messages — send email if SMTP configured, otherwise save to file
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) return res.status(400).json({ error: 'Missing fields' });
  const entry = { id: uuidv4(), name, email, message, createdAt: new Date().toISOString() };

  // try sending via SMTP if env vars provided
  const smtpHost = process.env.SMTP_HOST;
  if (smtpHost) {
    try {
      const nodemailer = require('nodemailer');
      const transportOpts = {
        host: smtpHost,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT,10) : 587,
        secure: process.env.SMTP_SECURE === 'true',
      };
      if (process.env.SMTP_USER) transportOpts.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' };
      const transporter = nodemailer.createTransport(transportOpts);
      const mailOpts = {
        from: process.env.CONTACT_FROM || (process.env.SMTP_USER || 'no-reply@example.com'),
        to: 'info@bagabayan.mn',
        subject: `Санал хүсэлт: ${name}`,
        text: `Нэр: ${name}\nИ-мэйл: ${email}\n\n${message}`,
        html: `<p><strong>Нэр:</strong> ${name}</p><p><strong>И-мэйл:</strong> ${email}</p><hr/><div>${message.replace(/\n/g,'<br/>')}</div>`
      };
      await transporter.sendMail(mailOpts);
      // save copy
      const items = readContacts(); items.unshift(entry); writeContacts(items);
      return res.json({ ok: true, sent: true });
    } catch (err) {
      // fallback to saving
      const items = readContacts(); items.unshift(entry); writeContacts(items);
      return res.status(200).json({ ok: true, sent: false, error: err.message });
    }
  }

  // no SMTP configured — persist to file
  try{
    const items = readContacts(); items.unshift(entry); writeContacts(items);
    return res.json({ ok: true, sent: false });
  }catch(e){
    return res.status(500).json({ error: 'Unable to save message' });
  }
});

app.get('/api/homepage', (req, res) => {
  res.json(readHome());
});

app.put('/api/homepage', requireAdmin, (req, res) => {
  const { intro } = req.body;
  const obj = readHome();
  if (typeof intro === 'string') obj.intro = intro;
  writeHome(obj);
  res.json(obj);
});

app.get('/api/news/:id', (req, res) => {
  const id = req.params.id;
  const item = newsStore.getById(id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

// auth status for client-side UI
app.get('/api/auth', (req, res) => {
  res.json({ admin: !!(req.session && req.session.admin) });
});

// explicit auth check endpoint (per request)
app.get('/api/auth/check', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.admin) });
});

// ADMIN (protected) API
app.post('/api/news', requireAdmin, upload.single('image'), (req, res) => {
  const { title, content, category, author } = req.body;
  const items = newsStore.readAll();
  const id = uuidv4();
  const image = req.file ? ('/public/uploads/' + req.file.filename) : null;
  const createdAt = new Date().toISOString();
  const entry = { id, title, content, image, createdAt };
  if (category) entry.category = category;
  if (author) entry.author = author;
  items.unshift(entry);
  newsStore.writeAll(items);
  res.json(entry);
});

app.put('/api/news/:id', requireAdmin, upload.single('image'), (req, res) => {
  const id = req.params.id;
  const items = newsStore.readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const { title, content, category, author } = req.body;
  if (title) items[idx].title = title;
  if (content) items[idx].content = content;
  if (req.file) {
    // remove old image if exists
    if (items[idx].image) {
      try { fs.unlinkSync(path.join(__dirname, '..', items[idx].image)); } catch (e) {}
    }
    items[idx].image = '/public/uploads/' + req.file.filename;
  }
  if (category !== undefined) items[idx].category = category;
  if (author !== undefined) items[idx].author = author;
  newsStore.writeAll(items);
  res.json(items[idx]);
});

app.delete('/api/news/:id', requireAdmin, (req, res) => {
  const id = req.params.id;
  const items = newsStore.readAll();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  // delete image file
  if (items[idx].image) {
    try { fs.unlinkSync(path.join(__dirname, '..', items[idx].image)); } catch (e) {}
  }
  items.splice(idx, 1);
  newsStore.writeAll(items);
  res.json({ success: true });
});

// Protect admin dashboard and admin assets
app.get('/admin/dashboard.html', requireAdmin, (req, res, next) => {
  next(); // static middleware will serve the file
});

// start
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
