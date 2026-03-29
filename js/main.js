const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });
}

const animatedItems = document.querySelectorAll('[data-animate]');
if (animatedItems.length) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  animatedItems.forEach((item) => observer.observe(item));
}

const yearSpan = document.querySelector('[data-year]');
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

// --- Auth check for admin and navbar profile behavior ---
(async function(){
  // default unknown until check completes
  window.isAdmin = undefined;
  async function doCheck(){
    try{
      const r = await fetch('/api/auth/check', { credentials: 'include' });
      if(!r.ok) { window.isAdmin = false; return; }
      const j = await r.json();
      window.isAdmin = !!j.authenticated;
      const p = document.getElementById('navProfile');
      if(p){
        // optional UX: change tooltip when logged in
        if(window.isAdmin) p.title = 'Dashboard';
        else p.title = 'Admin';
      }
    }catch(e){ window.isAdmin = false; }
  }

  // run check on load
  doCheck();

  // attach click behavior to profile icon
  document.addEventListener('click', async function onDocClick(e){
    const p = e.target.closest && e.target.closest('#navProfile');
    if(!p) return;
    e.preventDefault();
    // if known state, use it
    if(window.isAdmin === true) return window.location.href = '/admin/dashboard.html';
    if(window.isAdmin === false) return window.location.href = '/admin/login.html';
    // otherwise, perform quick check now
    try{
      const r = await fetch('/api/auth/check', { credentials: 'include' });
      if(r.ok){ const j = await r.json(); if(j.authenticated) return window.location.href = '/admin/dashboard.html'; }
    }catch(e){}
    window.location.href = '/admin/login.html';
  });
})();
