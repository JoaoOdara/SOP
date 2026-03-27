# Odara S&OP — Dashboard

Dashboard de S&OP (Sales & Operations Planning) para **Odara Alfajores**.  
HTML puro, sem build tools, hospedado no GitHub Pages.

---

## 🏗️ Estrutura

```
odara-sop/
├── index.html              → Visão Geral
├── planejamento.html       → Planejamento Mensal (HE configurável)
├── headcount.html          → Headcount por cenário
├── materiais.html          → Fluxo de Materiais / Paletes
├── acuracidade.html        → Acuracidade de Forecast
├── css/
│   └── style.css           → Design system compartilhado
└── js/
    ├── config.js           → URL + anon key Supabase ⚠️
    └── app.js              → Supabase client, nav, helpers
```

---

## ⚙️ Configuração

### 1. Substituir a anon key

Abra `js/config.js` e substitua `SUBSTITUIR_PELA_ANON_KEY` pela **anon key** do projeto Supabase:

```
Supabase Dashboard → projeto khqbimmcibutfrfmkoxr
→ Settings → API → Project API keys → anon public
```

```js
const SUPABASE_URL = 'https://khqbimmcibutfrfmkoxr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJI...'; // ← sua anon key aqui
```

### 2. Banco de dados

Execute no Supabase SQL Editor, nesta ordem:
1. `odara_sop_migration.sql` — cria as tabelas
2. `odara_sop_seed.sql` — carrega dados de referência

### 3. GitHub Pages

```
Repositório → Settings → Pages → Source: Deploy from branch → main → / (root)
```

URL: `https://[usuario].github.io/odara-sop/`

---

## 📦 Dependências (CDN)

| Lib | Versão | Uso |
|-----|--------|-----|
| Supabase JS | v2 | Banco de dados |
| Chart.js | 4.4.4 | Gráficos |
| Google Fonts | — | Barlow Semi Condensed + JetBrains Mono |

Nenhuma instalação necessária. Tudo carregado via CDN.

---

## 🔑 Segurança

- A **anon key** só permite leitura (RLS habilitado em todas as tabelas).
- Inserts/updates de dados são feitos via **service_role key** pelo sistema de upload — nunca exposta no frontend.
- `config.js` pode ser adicionado ao `.gitignore` se desejar evitar commitar a anon key (embora seja seguro expô-la).

---

## 📤 Fluxo Semanal

1. Exportar "ESTQ ATUAL PP" do Omie
2. Exportar "Faturamento por MêsAno" do Omie
3. Fazer upload via tela de upload (a implementar — Sprint 2)
4. Dashboard atualiza automaticamente na próxima abertura

---

## 🎨 Cores Odara

| Token | Hex | Uso |
|-------|-----|-----|
| `--amarelo` | `#FFB81D` | Destaque principal, KPIs |
| `--vermelho` | `#EE2737` | Alertas, críticos |
| `--bg` | `#0C0C0C` | Fundo |
| `--l01` | `#FFB81D` | Linha 01 |
| `--l02` | `#3B82F6` | Linha 02 |
| `--l03` | `#A78BFA` | Linha 03 |

---

## 📋 Projeto Supabase

- **ID:** `khqbimmcibutfrfmkoxr`
- **Prefixo tabelas:** `sop_`
- **Compartilhado com:** PQCDSM (tabelas prefixadas `pqcdsm_`)
