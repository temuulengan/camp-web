(async function(){
  async function getNews(){
    const r = await fetch('/api/news', { credentials: 'include' });
    if(!r.ok) return [];
    return r.json();
  }

  function short(text, n=120){
    if(!text) return '';
    return text.length>n? text.slice(0,n).trim() + '…' : text;
  }

  function cardHTML(item, featured=false){
    const badge = item.category? `<span class="badge">${item.category}</span>` : '<span class="badge">Мэдээ</span>';
    const author = item.author? `<span class="author">${item.author}</span>` : '';
    return `
      <article class="news-item ${featured? 'featured':''}">
        <div class="news-image">${item.image?`<img src="${item.image}" alt="${item.title}">`:`<div class="image-placeholder"></div>`}</div>
        <div class="news-content">
          <div class="meta-row">${badge}<div class="news-date">${new Date(item.createdAt).toLocaleDateString()}</div></div>
          <h3 class="news-title">${item.title}</h3>
          <div class="byline">${author} <span class="date">${new Date(item.createdAt).toLocaleString()}</span></div>
          <p class="preview">${short(item.content||'', 220)}</p>
          <div class="actions"><button class="button outline" data-id="${item.id}">Дэлгэрэнгүй</button></div>
        </div>
      </article>
    `;
  }

  function openDetail(item){
    const content = document.createElement('div');
    content.innerHTML = `
      ${item.image?`<div style="margin-bottom:12px"><img src="${item.image}" style="width:100%;border-radius:8px;object-fit:cover"/></div>`:''}
      <h3 style="margin-top:0;color:var(--primary)">${item.title}</h3>
      <div style="color:#666;font-size:13px;margin-bottom:12px">${new Date(item.createdAt).toLocaleString()}</div>
      <div style="white-space:pre-wrap">${item.content||''}</div>
    `;
    const footer = document.createElement('div');
    const closeBtn = document.createElement('button'); closeBtn.className='btn-ghost'; closeBtn.textContent='Close';
    footer.appendChild(closeBtn);
    Modal.open({ title:'Мэдээ', content, footer, beforeClose: ()=>true });
    closeBtn.onclick = ()=>Modal.close();
  }

  const grid = document.getElementById('grid');
  const items = await getNews();
  if(!items || !items.length){ grid.innerHTML = '<p>Мэдээлэл олдсонгүй.</p>'; return; }
  // featured first
  const html = items.map((it, idx)=> cardHTML(it, idx===0)).join('');
  grid.innerHTML = html;
  grid.querySelectorAll('button[data-id]').forEach(btn=>{
    btn.addEventListener('click', async (e)=>{
      const id = btn.getAttribute('data-id');
      const r = await fetch('/api/news/'+id, { credentials: 'include' });
      if(!r.ok) return alert('Not found');
      const item = await r.json();
      openDetail(item);
    });
  });
})();
