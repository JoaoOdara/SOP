# Odara S&OP Dashboard v2

Dashboard executivo de S&OP para Odara Alfajores — Porto Alegre, RS.

## Estrutura

```
odara-sop-v2/
├── index.html          → Visão Geral / Cockpit Executivo
├── demanda.html        → Demanda · Forecast vs Realizado · Acuracidade
├── supply.html         → Supply / Capacidade · Gargalos · HE configurável
├── estoque.html        → Estoque & Serviço · Cobertura · Ruptura
├── governanca.html     → Governança S&OP (stub)
├── financeiro.html     → Financeiro (stub)
├── cenarios.html       → Cenários e Decisão (stub)
├── portfolio.html      → Portfólio / NPI (stub)
├── acoes.html          → Ações e Follow-up (stub)
├── css/style.css       → Design system (tema escuro/claro, componentes)
└── js/
    ├── app.js          → Lógica compartilhada, mock data, helpers
    └── config.js       → Supabase URL + Key
```

## Como publicar (GitHub Pages)

1. Faça upload de todos os arquivos no repositório GitHub
2. Em Settings → Pages → Branch: main / root
3. Acesse via `https://seuusuario.github.io/odara-sop/`

> Não há build step. Tudo é HTML/CSS/JS puro — abre direto no browser.

## Configuração Supabase

Edite `js/config.js` com suas credenciais:
```js
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_KEY = 'SUA_CHAVE_ANON';
```

## Dados

Atualmente usando **mock data** coerente com o plano Odara 2026. Os dados reais virão via upload Omie (Sprint 3).

---
*Versão: v2.0 · Mar/2026*
