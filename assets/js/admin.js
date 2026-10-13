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
    const valor = v.valor == null ? '' : v.valor;
    const isLong = tipo === 'texto' && String(valor).length > 90;

    let input;
    if (isLong){
      input = `<textarea data-key="${esc(k)}" class="adm-field" rows="3">${esc(valor)}</textarea>`;
    } else if (tipo === 'imagem' || tipo === 'video'){
      input = `
        <div style="display:flex;gap:10px;align-items:flex-start;">
          <input data-key="${esc(k)}" class="adm-field" value="${esc(valor)}"
            style="flex:1;">
          <button type="button" class="adm-btn" data-upload="${esc(k)}"
            data-upload-tipo="${esc(tipo)}" style="white-space:nowrap;">Upload</button>
        </div>`;
    } else {
      input = `<input data-key="${esc(k)}" class="adm-field" value="${esc(valor)}">`;
    }

    return `
      <div>
        <label class="adm-label">
          ${esc(k)} <span style="opacity:.5;">(${esc(tipo)})</span>
        </label>
        ${input}
      </div>`;
  }

  async function saveConteudo(){
    const body = document.getElementById('tr-tab-body');
    const itens = [];
    body.querySelectorAll('[data-key]').forEach(el => {
      const k = el.getAttribute('data-key');
      const atual = CACHE.conteudo[k];
      itens.push({ chave:k, valor:el.value, tipo: atual ? atual.tipo : 'texto' });
    });
    const r = await api('saveConteudo', { itens });
    if (r.ok){
      toast('Salvo com sucesso!');
      const rr = await api('getAll');
      CACHE.conteudo = rr.conteudo || {};
      if (window.TR_refreshCMS) window.TR_refreshCMS();
    } else {
      toast(r.error || 'Erro', false);
    }
  }

  // ============================================================
  //  ABA: CURSOS
  // ============================================================
  function renderCursos(){
    const body = document.getElementById('tr-tab-body');
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div class="adm-group-title" style="margin:0;">Cursos cadastrados</div>
          <button id="tr-add-curso" class="adm-btn primary">+ Novo Curso</button>
        </div>
        <div id="tr-cursos-list"></div>
      </div>`;

    document.getElementById('tr-add-curso').addEventListener('click', async () => {
      const novo = {
        ordem: (CACHE.cursos.length + 1),
        topic: 'Nova Categoria',
        nome: 'Novo Curso',
        descricao: 'Descrição do curso',
        link_url: 'https://',
        video_youtube_id: ''
      };
      const r = await api('saveCurso', { curso: novo });
      if (r.ok){
        toast('Curso criado');
        const rr = await api('getAll');
        CACHE.cursos = rr.cursos || [];
        renderCursos();
      }
    });

    const list = document.getElementById('tr-cursos-list');
    list.innerHTML = CACHE.cursos.map(c => `
      <div class="adm-course-row" data-curso-id="${esc(c.id)}">
        <div style="display:grid;grid-template-columns:60px 1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label class="adm-label">Ordem</label>
            <input class="adm-field" data-field="ordem" value="${esc(c.ordem || '')}">
          </div>
          <div>
            <label class="adm-label">Categoria</label>
            <input class="adm-field" data-field="topic" value="${esc(c.topic || '')}">
          </div>
          <div>
            <label class="adm-label">Nome</label>
            <input class="adm-field" data-field="nome" value="${esc(c.nome || '')}">
          </div>
        </div>
        <div style="margin-bottom:12px;">
          <label class="adm-label">Descrição</label>
          <textarea class="adm-field" data-field="descricao" rows="2">${esc(c.descricao || '')}</textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label class="adm-label">Link</label>
            <input class="adm-field" data-field="link_url" value="${esc(c.link_url || '')}">
          </div>
          <div>
            <label class="adm-label">YouTube ID (só o código)</label>
            <input class="adm-field" data-field="video_youtube_id"
              value="${esc(c.video_youtube_id || '')}" placeholder="ex: pdoL5HBtW9Y">
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button class="adm-btn danger" data-del>Excluir</button>
          <button class="adm-btn primary" data-save>Salvar</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-curso-id]').forEach(row => {
      const id = row.getAttribute('data-curso-id');
      row.querySelector('[data-save]').addEventListener('click', async () => {
        const curso = { id };
        row.querySelectorAll('[data-field]').forEach(f => {
          curso[f.getAttribute('data-field')] = f.value;
        });
        const r = await api('saveCurso', { curso });
        if (r.ok){
          toast('Curso atualizado');
          const rr = await api('getAll');
          CACHE.cursos = rr.cursos || [];
          if (window.TR_refreshCMS) window.TR_refreshCMS();
        }
      });
      row.querySelector('[data-del]').addEventListener('click', async () => {
        if (!confirm('Excluir este curso?')) return;
        const r = await api('deleteCurso', { id });
        if (r.ok){
          toast('Curso excluído');
          const rr = await api('getAll');
          CACHE.cursos = rr.cursos || [];
          renderCursos();
          if (window.TR_refreshCMS) window.TR_refreshCMS();
        }
      });
    });
  }

  // ============================================================
  //  ABA: MÍDIA (uploads)
  // ============================================================
  function renderMidia(){
    const body = document.getElementById('tr-tab-body');
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="adm-card">
          <div class="adm-group-title">Enviar arquivo</div>
          <input type="file" id="tr-file" class="adm-field"
            accept="image/*,video/*" style="padding:10px;">
          <div id="tr-upload-progress"
            style="margin-top:12px;font-size:13px;color:#8a8069;"></div>
        </div>
        <div class="adm-group-title" style="margin-top:18px;">Arquivos enviados</div>
        <div id="tr-midia-list"></div>
      </div>`;

    const file = document.getElementById('tr-file');
    const prog = document.getElementById('tr-upload-progress');

    file.addEventListener('change', async e => {
      const f = e.target.files[0];
      if (!f) return;
      prog.textContent = 'Lendo arquivo…';
      const reader = new FileReader();
      reader.onload = async () => {
        const b64 = reader.result.split(',')[1];
        prog.textContent = 'Enviando para o Drive…';
        const tipo = f.type.startsWith('image') ? 'imagem'
                   : f.type.startsWith('video') ? 'video' : 'arquivo';
        const r = await api('upload', {
          fileName: f.name,
          mimeType: f.type,
          dataBase64: b64,
          tipo
        });
        if (r.ok){
          prog.innerHTML = `✅ Enviado! URL: <code style="color:#a69b84;
            word-break:break-all;">${esc(r.url)}</code>`;
          toast('Upload concluído!');
          const m = await api('getMidia');
          CACHE.midia = (m && m.dados) || [];
          renderMidiaList();
        } else {
          prog.textContent = '❌ ' + (r.error || 'Falha no upload');
        }
        file.value = '';
      };
      reader.readAsDataURL(f);
    });

    renderMidiaList();
  }

  function renderMidiaList(){
    const list = document.getElementById('tr-midia-list');
    if (!list) return;
    if (!CACHE.midia.length){
      list.innerHTML = `<div style="color:#8a8069;font-size:13px;
        padding:16px;text-align:center;">Nenhum arquivo enviado ainda.</div>`;
      return;
    }
    list.innerHTML = CACHE.midia.map(m => `
      <div class="adm-course-row" style="display:flex;gap:14px;align-items:center;">
        <div style="flex:1;min-width:0;">
          <div style="color:#efe6cd;font-size:14px;font-weight:600;
               overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${esc(m.nome)}
          </div>
          <div style="font-size:11px;color:#8a8069;margin-top:4px;
               overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${esc(m.url)}
          </div>
        </div>
        <button class="adm-btn" data-copy="${esc(m.url)}">Copiar URL</button>
        <button class="adm-btn danger" data-del-midia="${esc(m.id)}">Excluir</button>
      </div>
    `).join('');

    list.querySelectorAll('[data-copy]').forEach(b => {
      b.addEventListener('click', () => {
        navigator.clipboard.writeText(b.getAttribute('data-copy'));
        toast('URL copiada!');
      });
    });
    list.querySelectorAll('[data-del-midia]').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('Excluir arquivo do Drive?')) return;
        const r = await api('deleteMidia', { id: b.getAttribute('data-del-midia') });
        if (r.ok){
          toast('Arquivo excluído');
          const m = await api('getMidia');
          CACHE.midia = (m && m.dados) || [];
          renderMidiaList();
        }
      });
    });
  }
})();
