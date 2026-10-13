# Tales Ramiro — Site + CMS

Site institucional com painel administrativo (Google Sheets + Drive).

## 🗂️ Estrutura

- `index.html` — página principal
- `admin.html` — painel administrativo (link direto)
- `config.js` — URL da API
- `assets/css/` — estilos
- `assets/js/` — scripts
- `assets/img/` — imagens
- `assets/video/` — vídeos locais

## 🚀 Setup

1. Crie planilha Google → Extensões → Apps Script
2. Cole `Code.gs` → execute `setupPlanilha`
3. Implantar → App da Web (qualquer pessoa)
4. Copie a URL e cole em `config.js`
5. Faça upload deste repo

## 🔐 Acesso admin

- Clique no cadeado (rodapé) ou abra `/admin.html`
- Senha padrão: `2026` (troque em `CONFIG.ADMIN_PASSWORD` no `Code.gs`)

## 🌐 Deploy

Compatible com GitHub Pages, Netlify, Vercel, Cloudflare Pages.
