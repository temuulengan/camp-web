const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'public');

async function rmrf(p){
  try{ await fsp.rm(p, { recursive: true, force: true }); }catch(e){}
}

async function ensureDir(p){
  try{ await fsp.mkdir(p, { recursive: true }); }catch(e){}
}

async function copy(src, dest){
  const s = path.join(root, src);
  const d = path.join(out, dest || src);
  try{
    await ensureDir(path.dirname(d));
    // use fs.cp if available
    if (fsp.cp) {
      await fsp.cp(s, d, { recursive: true });
    } else {
      // fallback: simple copy for files and directories
      const stat = await fsp.stat(s);
      if (stat.isDirectory()) {
        await ensureDir(d);
        const items = await fsp.readdir(s);
        for (const it of items) await copy(path.join(src, it), path.join(dest || src, it));
      } else {
        await fsp.copyFile(s, d);
      }
    }
  } catch (e) {
    // ignore missing sources
  }
}

(async ()=>{
  await rmrf(out);
  await ensureDir(out);
  // Copy common static assets
  const sources = ['index.html','css','js','pages','assets','images','public/uploads'];
  for (const s of sources) {
    await copy(s);
  }
  console.log('Build: copied static files to', out);
})();
