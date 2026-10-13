/* ============================================================
   CMS — carrega dados do Google Sheets e injeta no site
   ============================================================ */
(function(){
  'use strict';

  const CFG = window.TR_CONFIG || {};
  const API = CFG.API_URL;
  const CACHE_MS = CFG.CACHE_MS || 5 * 60 * 1000;
  const CACHE_KEY = 'tr_cms_cache_v' + (CFG.VERSION || '1');

  if (!API || API.indexOf('COLE_AQUI') === 0){
    console.warn('[CMS] API_URL não configurada em config.js');
    return;
  }

  // ---------- Cache local ----------
  function readCache(){
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const obj = JSON.parse(raw);
      if (Date.now() - obj.t > CACHE_MS) return null;
      return obj.d;
    } catch(e){ return null; }
  }
  function writeCache(d){
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d })); } catch(e){}
  }

  // ---------- Fetch ----------
  async function fetchData(){
    const cached = readCache();
    if (cached) return cached;
    try {
      const res = await fetch(API + '?action=getAll', { method: 'GET' });
      const data = await res.json();
      if (data.ok){ writeCache(data); return data; }
      return { ok:false, conteudo:{}, cursos:[] };
    } catch(e){
      console.warn('[CMS] Falha ao buscar:', e);
      return { ok:false, conteudo:{}, cursos:[] };
    }
  }

  // ---------- Aplica textos e imagens ----------
  function applyConteudo(conteudo){
    if (!conteudo) return;

    // [data-cms="chave"] → texto
    document.querySelectorAll('[data-cms]').forEach(el => {
      const key = el.getAttribute('data-cms');
      const item = conteudo[key];
      if (item && item.valor != null){
        el.textContent = item.valor;
      }
    });

    // [data-cms-src="chave"] → src de imagem
    document.querySelectorAll('[data-cms-src]').forEach(el => {
      const key = el.getAttribute('data-cms-src');
      const item = conteudo[key];
      if (item && item.valor){
        el.setAttribute('src', item.valor);
      }
    });

    // [data-cms-src-yt="chave"] → iframe YouTube (só o ID)
    document.querySelectorAll('[data-cms-src-yt]').forEach(el => {
      const key = el.getAttribute('data-cms-src-yt');
      const item = conteudo[key];
      if (item && item.valor){
        const id = item.valor;
        el.setAttribute('data-src',
          `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&enablejsapi=1`);
      }
    });

    // Stats: número / prefixo / sufixo
    document.querySelectorAll('[data-cms-num]').forEach(el => {
      const kNum = el.getAttribute('data-cms-num');
      const kPre = el.getAttribute('data-cms-prefix');
      const kSuf = el.getAttribute('data-cms-suffix');
      if (conteudo[kNum]) el.setAttribute('data-count', conteudo[kNum].valor);
      if (kPre && conteudo[kPre]) el.setAttribute('data-prefix', conteudo[kPre].valor);
      if (kSuf && conteudo[kSuf]) el.setAttribute('data-suffix', conteudo[kSuf].valor);
    });

    // Vídeo scroll
    const vs = document.querySelector('[data-cms-video]');
    if (vs){
      const key = vs.getAttribute('data-cms-video');
      const item = conteudo[key];
      if (item && item.valor) vs.setAttribute('data-src', item.valor);
    }

    // Palavras do vídeo scroll
    const vTrack = document.querySelector('[data-vss]');
    if (vTrack && conteudo['video_scroll.palavras']){
      vTrack.setAttribute('data-words', conteudo['video_scroll.palavras'].valor);
    }
  }

  // ---------- Aplica cursos ----------
  function applyCursos(cursos){
    const grid = document.querySelector('[data-cursos-grid]');
    if (!grid || !cursos || !cursos.length) return;

    const arrow = `<svg class="crs-arrow" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
      stroke-linejoin="round"><path d="M7 17 17 7"></path><path d="M8 7h9v9"></path></svg>`;

    const arrowBtn = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
      style="width:1.05em;height:1.05em;flex:none;">
      <path d="M7 17 17 7"></path><path d="M8 7h9v9"></path></svg>`;

    grid.innerHTML = cursos.map((c, i) => {
      const num = String(i + 1).padStart(2, '0');
      const ytId = String(c.video_youtube_id || '').trim();
      const link = c.link_url || '#';

      let media;
      if (ytId){
        media = `<iframe class="crs-vid"
          data-ar="0.5625"
          data-src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${ytId}&modestbranding=1&rel=0&playsinline=1&disablekb=1&fs=0&iv_load_policy=3&showinfo=0&enablejsapi=1"
          loading="lazy" title="vídeo do curso" frameborder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
      } else {
        media = `<div style="width:100%;height:100%;background:#1a1f26;
          display:flex;align-items:center;justify-content:center;
          color:#8a8069;font-size:11px;letter-spacing:.2em;
          text-transform:uppercase;">Sem vídeo</div>`;
      }

      return `
        <article class="off-card">
          <div class="off-media">
            <div class="off-media-in">${media}</div>
          </div>
          <div class="off-body">
            <div class="off-topic">
              <span class="off-num">${num}</span>
              <span>${escapeHtml(c.topic || '')}</span>
            </div>
            <div class="off-names">
              <a class="crs-name off-name" href="${escapeAttr(link)}"
                 target="_blank" rel="noopener">
                <span class="crs-roll"><span class="crs-roll-in"
                  data-w="${escapeAttr(c.nome || '')}">${escapeHtml(c.nome || '')}</span></span>
                ${arrow}
              </a>
            </div>
            <p class="off-desc">${escapeHtml(c.descricao || '')}</p>
            <a class="story-btn off-btn" href="${escapeAttr(link)}"
               target="_blank" rel="noopener">Saber mais ${arrowBtn}</a>
          </div>
        </article>`;
    }).join('');

    // Re-inicializa observers para as novas cards
    if (window.TR_reinitCards) window.TR_reinitCards();
    if (window.TR_reinitVideos) window.TR_reinitVideos();
  }

  // ---------- helpers ----------
  function escapeHtml(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function escapeAttr(s){ return escapeHtml(s); }

  // ---------- Boot ----------
  async function init(){
    const data = await fetchData();
    if (!data.ok) return;
    applyConteudo(data.conteudo || {});
    applyCursos(data.cursos || []);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // expõe para o admin pedir refresh
  window.TR_refreshCMS = async function(){
    try { localStorage.removeItem(CACHE_KEY); } catch(e){}
    await init();
  };
})();
