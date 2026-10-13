/* ============================================================
   MAIN — orquestrador
   ============================================================ */
(function(){
  'use strict';

  // esconde loader
  function hideLoader(){
    const l = document.getElementById('tr-loader');
    if (!l) return;
    l.style.opacity = '0';
    setTimeout(() => l.style.display = 'none', 720);
  }
  if (document.readyState === 'complete') hideLoader();
  else window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 6000);

  // menu flutuante + go-top + visibilidade
  document.addEventListener('DOMContentLoaded', () => {
    const fm = document.querySelector('[data-fmenu]');
    if (fm){
      const btn = fm.querySelector('.fmenu-btn');
      const close = () => { fm.classList.remove('open'); btn.setAttribute('aria-expanded','false'); };
      btn.addEventListener('click', e => {
        e.stopPropagation();
        fm.classList.toggle('open');
        btn.setAttribute('aria-expanded', fm.classList.contains('open'));
      });
      document.addEventListener('click', e => {
        if (fm.classList.contains('open') && !fm.contains(e.target)) close();
      });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    }

    const gt = document.querySelector('[data-gotop]');
    if (gt){
      gt.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
      const chk = () => {
        const s = (window.pageYOffset || 0) > window.innerHeight * 1.25;
        gt.classList.toggle('show', s);
      };
      window.addEventListener('scroll', chk, { passive:true });
      chk();
    }
  });

  // pausa animações quando aba está oculta
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('tr-bg', document.hidden);
  });
})();
