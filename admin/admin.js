(function(){
  const listEl = document.getElementById('list');
  const addBtn = document.getElementById('addNews');
  const homeEditBtn = document.getElementById('editHome');

  async function fetchNews(){
    const res = await fetch('https://camp-web-backend.onrender.com/api/news', { credentials: 'include' });
    return res.json();
  }

  function renderList(items){
    listEl.innerHTML = '';
    items.forEach(item=>{
      const row = document.createElement('div'); row.className='news-item';
      const meta = document.createElement('div'); meta.className='news-meta';
      meta.innerHTML = `<strong>${item.title}</strong><div style="font-size:12px;color:#666">${new Date(item.createdAt).toLocaleString()}</div>`;
      const controls = document.createElement('div'); controls.className='controls';
      const edit = document.createElement('button'); edit.textContent='Edit'; edit.className='btn-ghost';
      const del = document.createElement('button'); del.textContent='Delete'; del.className='btn-ghost';
      edit.onclick = ()=>openEditor('edit', item);
      del.onclick = async ()=>{
        if(!confirm('Устгахдаа итгэлтэй байна уу?')) return;
          await fetch('https://camp-web-backend.onrender.com/api/news/'+item.id,{method:'DELETE', credentials:'include'});
        await reload();
      };
      controls.appendChild(edit); controls.appendChild(del);
      row.appendChild(meta); row.appendChild(controls);
      listEl.appendChild(row);
    });
  }

  async function reload(){
    const items = await fetchNews();
    renderList(items);
  }

  function createFormEl(data){
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="field-row">
        <label>Гарчиг</label>
        <input class="input" name="title" value="${data?.title?data.title:''}" />
      </div>
      <div class="field-row">
        <label>Зохиогч</label>
        <input class="input" name="author" value="${data?.author?data.author:''}" />
      </div>
      <div class="field-row">
        <label>Ангилал</label>
        <select name="category" class="input">
          <option value="Мэдээ">Мэдээ</option>
          <option value="Онцлох">Онцлох</option>
        </select>
      </div>
      <div class="field-row">
        <label>Агуулга</label>
        <textarea class="input" name="content" rows="6">${data?.content?data.content:''}</textarea>
      </div>
      <div class="field-row">
        <label>Зураг (опциональ)</label>
        <input type="file" name="image" accept="image/*" />
        <img class="img-preview" style="display:none" src="" />
      </div>
    `;
    const fileInput = wrap.querySelector('input[type=file]');
    const preview = wrap.querySelector('.img-preview');
    if (data && data.image) { preview.src = data.image; preview.style.display='block'; }
    if (data && data.category) {
      const sel = wrap.querySelector('select[name=category]');
      if (sel) sel.value = data.category;
    }
    if (data && data.author) {
      const auth = wrap.querySelector('input[name=author]');
      if (auth) auth.value = data.author;
    }
    fileInput.addEventListener('change', (e)=>{
      const f = e.target.files[0];
      if(!f) { preview.style.display='none'; preview.src=''; return; }
      const url = URL.createObjectURL(f); preview.src = url; preview.style.display='block';
    });
    return wrap;
  }

  function openEditor(mode, item){
    const data = mode==='edit'?item:null;
    const content = createFormEl(data);
    const footer = document.createElement('div');
    const saveBtn = document.createElement('button'); saveBtn.className='btn-primary'; saveBtn.textContent='Save';
    const cancelBtn = document.createElement('button'); cancelBtn.className='btn-ghost'; cancelBtn.textContent='Close';
    footer.appendChild(cancelBtn); footer.appendChild(saveBtn);

    let dirty = false;
    content.querySelectorAll('input,textarea').forEach(el=>{
      el.addEventListener('input', ()=>dirty=true);
      el.addEventListener('change', ()=>dirty=true);
    });

    Modal.open({ title: mode==='edit'?'Edit News':'Add News', content, footer, beforeClose: ()=>{
      if(dirty && !confirm('Гарахдаа итгэлтэй байна уу?')) return false; return true;
    }});

    cancelBtn.onclick = ()=>{ Modal.close(); };

      saveBtn.onclick = async ()=>{
      saveBtn.disabled = true; saveBtn.textContent='Saving...';
      const fd = new FormData();
      fd.append('title', content.querySelector('[name=title]').value);
      const catEl = content.querySelector('[name=category]');
      if(catEl) fd.append('category', catEl.value);
      const authEl = content.querySelector('[name=author]');
      if(authEl) fd.append('author', authEl.value);
      fd.append('content', content.querySelector('[name=content]').value);
      const file = content.querySelector('input[type=file]').files[0];
      if (file) fd.append('image', file);
      try{
        if(mode==='edit'){
          await fetch('https://camp-web-backend.onrender.com/api/news/'+item.id,{method:'PUT',body:fd, credentials:'include'});
        } else {
          await fetch('https://camp-web-backend.onrender.com/api/news',{method:'POST',body:fd, credentials:'include'});
        }
        Modal.close();
        await reload();
        alert('Амжилттай хадгаллаа');
        // If this was a newly added news item, return to homepage
        if (mode === 'add') {
          window.location.href = '/index.html';
        }
      }catch(err){
        alert('Алдаа гарлаа');
      }finally{ saveBtn.disabled=false; saveBtn.textContent='Save'; }
    };
  }

  addBtn.addEventListener('click', ()=>openEditor('add'));

  homeEditBtn.addEventListener('click', async ()=>{
    const res = await fetch('https://YOUR-RENDER-URL.onrender.com/api/homepage', { credentials: 'include' });
    const obj = await res.json();
    const wrap = document.createElement('div');
    wrap.innerHTML = `<div class="field-row"><label>Intro paragraph</label><textarea class="input" rows="6">${obj.intro||''}</textarea></div>`;
    const footer = document.createElement('div');
    const save = document.createElement('button'); save.className='btn-primary'; save.textContent='Save';
    const close = document.createElement('button'); close.className='btn-ghost'; close.textContent='Close';
    footer.appendChild(close); footer.appendChild(save);

    Modal.open({ title:'Edit Homepage Intro', content:wrap, footer, beforeClose: ()=>true });
    close.onclick = ()=>Modal.close();
    save.onclick = async ()=>{
      save.disabled=true; save.textContent='Saving...';
      const intro = wrap.querySelector('textarea').value;
      await fetch('https://YOUR-RENDER-URL.onrender.com/api/homepage',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({intro}), credentials:'include'});
      save.disabled=false; save.textContent='Save';
      Modal.close();
      alert('Homepage intro updated');
      // update preview on page? leave to refresh
    };
  });

  // initial load
  reload();
})();
