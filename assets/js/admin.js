/* ============================================================
   PAINEL ADMIN — Tales Ramiro CMS
   ============================================================ */
(function(){
  'use strict';

  const CFG = window.TR_CONFIG || {};
  const API = CFG.API_URL;
  const lock  = document.getElementById('tr-admin-lock');
  const modal = document.getElementById('tr-admin-modal');
  const box   = document.getElementById('tr-admin-box');

  if (!lock || !modal || !box) return;

  let TOKEN = sessionStorage.getItem('tr_admin_token') || '';
  let CACHE = { conteudo:{}, cursos:[], midia:[] };
  let TAB   = 'conteudo';

  // ---------- API ----------
  async function api(action, payload){
    payload = payload || {};
    const res = await fetch(API, {
      method:'POST',
      body: JSON.stringify(Object.assign({ action, token: TOKEN }, payload)),
      headers: { 'Content-Type':'text/plain;charset=utf-8' },
      redirect:'follow'
    });
    return res.json();
  }

  // ---------- utils ----------
  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function toast(msg, ok){
    ok = ok !== false;
    const t = document.createElement('div');
    t.className = 'adm-toast' + (ok ? '' : ' err');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => t.remove(), 350);
    }, 2600);
  }

  // ---------- open / close ----------
  function openModal(){
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  lock.addEventListener('click', () => {
    openModal();
    TOKEN ? renderDashboard() : renderLogin();
  });
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ============================================================
  //  LOGIN
  // ============================================================
  function renderLogin(){
    box.innerHTML = `
      <div style="max-width:400px;margin:50px auto;text-align:center;">
        <div style="font-family:'League Gothic','League Gothic Condensed',sans-serif;
             font-size:46px;text-transform:uppercase;letter-spacing:.03em;
             color:#efe6cd;line-height:1;">Painel Admin</div>
        <p style="color:#8a8069;font-size:12px;letter-spacing:.18em;
                  text-transform:uppercase;margin:12px 0 32px;">Acesso restrito</p>
        <input id="tr-pwd" class="adm-field" type="password"
          placeholder="Senha" autocomplete="current-password"
          style="padding:15px 20px;font-size:16px;margin-bottom:14px;">
        <button id="tr-login-btn" class="adm-btn primary"
          style="width:100%;padding:15px;font-size:13px;letter-spacing:.18em;">Entrar</button>
        <div id="tr-login-msg"
          style="color:#e57373;font-size:13px;margin-top:14px;min-height:18px;"></div>
        <button id="tr-login-cancel"
          style="margin-top:22px;background:transparent;color:#8a8069;border:0;
                 font-size:12px;letter-spacing:.14em;text-transform:uppercase;
                 cursor:pointer;font-family:inherit;">Fechar</button>
      </div>`;

    const pwd = document.getElementById('tr-pwd');
    const btn = document.getElementById('tr-login-btn');
    const msg = document.getElementById('tr-login-msg');
    pwd.focus();

    async function doLogin(){
      msg.textContent = 'Verificando…'; msg.style.color = '#8a8069';
      try {
        const r = await api('login', { senha: pwd.value });
        if (r.ok){
          TOKEN = r.token;
          sessionStorage.setItem('tr_admin_token', TOKEN);
          renderDashboard();
        } else {
          msg.textContent = r.error || 'Falha no login';
          msg.style.color = '#e57373';
        }
      } catch(err){
        msg.textContent = 'Erro de conexão';
        msg.style.color = '#e57373';
      }
    }
    btn.addEventListener('click', doLogin);
    pwd.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    document.getElementById('tr-login-cancel').addEventListener('click', closeModal);
  }

  // ============================================================
  //  DASHBOARD
  // ============================================================
  async function renderDashboard(){
    box.innerHTML = `<div style="padding:80px;text-align:center;color:#8a8069;">
      Carregando dados…</div>`;
    try {
      const [r, m] = await Promise.all([ api('getAll'), api('getMidia') ]);
      if (!r.ok){
        TOKEN=''; sessionStorage.removeItem('tr_admin_token');
        toast(r.error || 'Sessão expirada', false);
        return renderLogin();
      }
      CACHE.conteudo = r.conteudo || {};
      CACHE.cursos   = r.cursos   || [];
      CACHE.midia    = (m && m.dados) || [];
      renderTabs();
    } catch(err){
      box.innerHTML = `<div style="padding:60px;text-align:center;color:#e57373;">
        Erro ao carregar. Verifique a URL do Apps Script.<br><br>
        <small style="color:#8a8069;">${esc(String(err))}</small></div>`;
    }
  }

  function renderTabs(){
    const tabs = [
      { id:'conteudo', label:'Textos & Imagens' },
      { id:'cursos',   label:'Cursos' },
      { id:'midia',    label:'Uploads' }
    ];
    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;
                  gap:18px;flex-wrap:wrap;margin-bottom:26px;
                  padding-bottom:22px;border-bottom:1px solid rgba(166,155,132,.2);">
        <div>
          <div style="font-family:'League Gothic',sans-serif;font-size:40px;
               text-transform:uppercase;color:#efe6cd;line-height:1;">Painel Admin</div>
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;
               color:#8a8069;margin-top:6px;">Tales Ramiro CMS</div>
        </div>
        <div style="display:flex;gap:10px;">
          <button id="tr-logout" class="adm-btn">Sair</button>
          <button id="tr-close" class="adm-btn primary">Fechar</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:26px;flex-wrap:wrap;">
        ${tabs.map(t => `
          <button data-tab="${t.id}" class="adm-tab ${t.id===TAB?'on':''}">
            ${t.label}</button>`).join('')}
      </div>
      <div id="tr-tab-body"></div>`;

    document.getElementById('tr-close').addEventListener('click', closeModal);
    document.getElementById('tr-logout').addEventListener('click', () => {
      TOKEN=''; sessionStorage.removeItem('tr_admin_token'); renderLogin();
    });
    box.querySelectorAll('[data-tab]').forEach(b =>
      b.addEventListener('click', () => { TAB = b.getAttribute('data-tab'); renderTabs(); })
    );

    if (TAB === 'conteudo') renderConteudo();
    if (TAB === 'cursos')   renderCursos();
    if (TAB === 'midia')    renderMidia();
  }

  // ============================================================
  //  ABA: CONTEÚDO
  // ============================================================
  function renderConteudo(){
    const body = document.getElementById('tr-tab-body');
    const entradas = Object.entries(CACHE.conteudo || {});

    const grupos = [
      { pref:'hero.',         titulo:'Hero (Topo)' },
      { pref:'stat.',         titulo:'Estatísticas' },
      { pref:'bio.',          titulo:'Biografia' },
      { pref:'marcas.',       titulo:'Seção de Marcas' },
      { pref:'video_scroll.', titulo:'Vídeo Scroll' },
      { pref:'footer.',       titulo:'Rodapé' }
    ];

    const grouped = {};
    grupos.forEach(g => grouped[g.pref] = []);
    entradas.forEach(([k, v]) => {
      const g = grupos.find(g => k.startsWith(g.pref));
      if (g) grouped[g.pref].push([k, v]);
    });

    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:24px;">
        ${grupos.map(g => {
          const items = grouped[g.pref] || [];
          if (!items.length) return '';
          return `
            <div class="adm-card">
              <div class="adm-group-title">${g.titulo}</div>
              <div style="display:flex;flex-direction:column;gap:14px;">
                ${items.map(([k, v]) => renderField(k, v)).join('')}
              </div>
            </div>`;
        }).join('')}
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button id="tr-save-conteudo" class="adm-btn primary"
            style="padding:14px 30px;font-size:13px;">Salvar Alterações</button>
        </div>
      </div>`;

    document.getElementById('tr-save-conteudo').addEventListener('click', saveConteudo);
  }

  function renderField(k, v){
    const tipo = v.tipo || 'texto';
    const valor = v.valor == null
