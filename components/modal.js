(function(){
  function createBackdrop(){
    const bd = document.createElement('div'); bd.className='modal-backdrop'; bd.setAttribute('aria-hidden','true');
    bd.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header"><div class="modal-title"></div><button class="modal-close btn-ghost">✕</button></div>
        <div class="modal-body"></div>
        <div class="modal-footer"></div>
      </div>`;
    document.body.appendChild(bd);
    return bd;
  }

  const backdrop = createBackdrop();
  const titleEl = backdrop.querySelector('.modal-title');
  const bodyEl = backdrop.querySelector('.modal-body');
  const footerEl = backdrop.querySelector('.modal-footer');
  const closeBtn = backdrop.querySelector('.modal-close');

  let beforeClose = null;

  function open(options){
    titleEl.textContent = options.title || '';
    bodyEl.innerHTML = '';
    footerEl.innerHTML = '';

    if (options.content instanceof HTMLElement) bodyEl.appendChild(options.content);
    else bodyEl.innerHTML = options.content || '';

    if (options.footer) footerEl.appendChild(options.footer);

    beforeClose = options.beforeClose || null;

    backdrop.classList.add('show');
    backdrop.setAttribute('aria-hidden','false');
  }

  function close(){
    if (typeof beforeClose === 'function'){
      const ok = beforeClose();
      if (!ok) return; // cancel close
    }
    backdrop.classList.remove('show');
    backdrop.setAttribute('aria-hidden','true');
  }

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e)=>{ if (e.target===backdrop) close(); });

  window.Modal = { open, close };
})();
