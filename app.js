/* ══════════════════════════════════════════════════════════════
   ODARA S&OP — app.js v3.0
   Arquitetura: Supabase-first. Sem localStorage para dados.
   localStorage APENAS para: tema (dark/light) e nome do usuário no log.
══════════════════════════════════════════════════════════════ */

// ── Supabase client ───────────────────────────────────────────
let db = null;

function initSupabase() {
  try {
    if (typeof supabase === 'undefined') { console.warn('Supabase SDK não carregado'); return; }
    if (!SUPABASE_URL || SUPABASE_URL.includes('SEU-') ||
        !SUPABASE_KEY || SUPABASE_KEY.includes('YOUR_')) {
      console.warn('Supabase: credenciais não configuradas.');
      return;
    }
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.info('Supabase: conectado a', SUPABASE_URL);
  } catch(e) { console.error('Supabase init error:', e); }
}

function isDbReady() { return db !== null; }

// ── Supabase DB helpers ───────────────────────────────────────
async function dbSelect(table, opts) {
  if (!isDbReady()) return [];
  try {
    let q = db.from(table).select(opts.select || '*');
    if (opts.eq)    Object.entries(opts.eq).forEach(([k,v]) => q = q.eq(k, v));
    if (opts.like)  Object.entries(opts.like).forEach(([k,v]) => q = q.like(k, v));
    if (opts.order) q = q.order(opts.order, { ascending: opts.asc !== false });
    if (opts.limit) q = q.limit(opts.limit);
    const { data, error } = await q;
    if (error) { console.error('dbSelect', table, error.message); return []; }
    return data || [];
  } catch(e) { console.error('dbSelect exception', e); return []; }
}

async function dbUpsert(table, rows, conflict) {
  if (!isDbReady()) {
    showToast('Supabase não conectado. Configure as credenciais em Dados & Sync.', 'error', 6000);
    return false;
  }
  try {
    const { error } = await db.from(table)
      .upsert(Array.isArray(rows) ? rows : [rows], { onConflict: conflict || 'id' });
    if (error) { console.error('dbUpsert', table, error.message); showToast('Erro ao salvar: ' + error.message, 'error'); return false; }
    return true;
  } catch(e) { console.error('dbUpsert exception', e); return false; }
}

async function dbDelete(table, match) {
  if (!isDbReady()) return false;
  try {
    let q = db.from(table).delete();
    Object.entries(match).forEach(([k,v]) => q = q.eq(k, v));
    const { error } = await q;
    if (error) { console.error('dbDelete', table, error.message); return false; }
    return true;
  } catch(e) { return false; }
}

// ── Loading overlay ───────────────────────────────────────────
function showLoader(msg) {
  let el = document.getElementById('_sop_loader');
  if (!el) {
    el = document.createElement('div');
    el.id = '_sop_loader';
    el.style.cssText = [
      'position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center',
      'background:var(--bg);flex-direction:column;gap:14px;font-family:var(--font-mono);color:var(--txt-3)'
    ].join(';');
    el.innerHTML = '<div class="spinner"></div><div id="_sop_loader_msg" style="font-size:.78rem"></div>';
    document.body.appendChild(el);
  }
  document.getElementById('_sop_loader_msg').textContent = msg || 'Carregando…';
  el.style.display = 'flex';
}
function hideLoader() {
  const el = document.getElementById('_sop_loader');
  if (el) el.style.display = 'none';
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, type, duration) {
  type = type || 'ok'; duration = duration || 3000;
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div'); t.id = 'toast';
    Object.assign(t.style, {
      position:'fixed', bottom:'20px', right:'20px', zIndex:'9999',
      padding:'10px 16px', borderRadius:'6px', fontFamily:'var(--font-mono)',
      fontSize:'.78rem', fontWeight:'600', maxWidth:'420px',
      opacity:'0', transition:'opacity .25s', pointerEvents:'none',
    });
    document.body.appendChild(t);
  }
  const styles = {
    ok:    'background:var(--verde-dim);color:var(--verde);border:1px solid rgba(34,197,94,.3)',
    error: 'background:var(--vermelho-dim);color:#FF7B85;border:1px solid rgba(238,39,55,.3)',
    warn:  'background:var(--amarelo-dim);color:var(--amarelo);border:1px solid rgba(255,184,29,.2)',
  };
  t.style.cssText = t.style.cssText + ';' + (styles[type] || styles.ok);
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.style.opacity = '0', duration);
}

// ── Theme (única coisa em localStorage) ──────────────────────
function getTheme() { return localStorage.getItem('odara-theme') || 'dark'; }
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('odara-theme', t);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = t === 'dark' ? '☀ Claro' : '◑ Escuro';
}
function toggleTheme() { applyTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

// ── Chart.js defaults ─────────────────────────────────────────
function setChartDefaults() {
  if (typeof Chart === 'undefined') return;
  const t = getTheme();
  Chart.defaults.color       = t === 'light' ? '#555' : '#888';
  Chart.defaults.borderColor = t === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'JetBrains Mono',monospace";
  Chart.defaults.font.size   = 11;
  Chart.defaults.plugins.legend.labels.boxWidth  = 8;
  Chart.defaults.plugins.legend.labels.padding   = 12;
  Chart.defaults.plugins.tooltip.backgroundColor = t === 'light' ? '#fff' : '#1C1C1C';
  Chart.defaults.plugins.tooltip.borderColor     = t === 'light' ? '#ddd' : '#333';
  Chart.defaults.plugins.tooltip.borderWidth     = 1;
  Chart.defaults.plugins.tooltip.padding         = 10;
  Chart.defaults.plugins.tooltip.mode            = 'index';
  Chart.defaults.plugins.tooltip.intersect       = false;
  Chart.defaults.plugins.tooltip.animation       = { duration: 80 };
  Chart.defaults.plugins.tooltip.titleFont = { family:"'Barlow Semi Condensed'", size:12, weight:'700' };
  Chart.defaults.interaction = { mode:'index', intersect:false };
}

// ══════════════════════════════════════════════════════════════
//  DB DATA LAYER — todas as leituras/escritas vão pelo Supabase
// ══════════════════════════════════════════════════════════════

// ── METAS (sop_config_geral com prefixo meta_) ────────────────
const METAS_DEFAULT = {
  fa_min: 88, wmape_max: 12,
  cob_min: 10,       // dias de venda
  cob_excesso: 40,   // dias de venda
  otif_meta: 98, fill_rate_meta: 99,
  receita_ano: 36.4, util_max: 95, bias_max: 5,
};
let METAS = { ...METAS_DEFAULT };

async function loadMetas() {
  const rows = await dbSelect('sop_config_geral', { like: { chave: 'meta_%' } });
  if (rows.length) {
    rows.forEach(r => {
      const k = r.chave.replace('meta_', '');
      if (k in METAS) METAS[k] = Number(r.valor);
    });
  }
  return METAS;
}

async function saveMetas(m) {
  METAS = { ...m };
  const rows = Object.entries(m).map(([k, v]) => ({
    chave: 'meta_' + k,
    valor: String(v),
    tipo:  'number',
    descricao: 'Meta S&OP: ' + k,
  }));
  const ok = await dbUpsert('sop_config_geral', rows, 'chave');
  if (ok) {
    logChange('Configurações', 'Metas S&OP atualizadas', JSON.stringify(m));
    showToast('Metas salvas no Supabase', 'ok');
  }
  return ok;
}

// ── CAP CONFIG (sop_config_geral) ─────────────────────────────
let CAP_CONFIG = { L01:{dia:25920,turnos:1,turnoH:8.8}, L02:{dia:8640,turnos:1,turnoH:8.8}, L03:{dia:20000,turnos:1,turnoH:8.8} };

async function loadCapConfig() {
  const rows = await dbSelect('sop_config_geral', { like: { chave: 'cap_%' } });
  rows.forEach(r => {
    const parts = r.chave.split('_'); // cap_L01_dia
    if (parts.length === 3) {
      const linha = parts[1], campo = parts[2];
      if (!CAP_CONFIG[linha]) CAP_CONFIG[linha] = {};
      CAP_CONFIG[linha][campo] = Number(r.valor);
    }
  });
  return CAP_CONFIG;
}

async function saveCapConfig(cfg) {
  CAP_CONFIG = { ...cfg };
  const rows = [];
  Object.entries(cfg).forEach(([linha, vals]) => {
    Object.entries(vals).forEach(([campo, val]) => {
      rows.push({ chave: `cap_${linha}_${campo}`, valor: String(val), tipo: 'number' });
    });
  });
  const ok = await dbUpsert('sop_config_geral', rows, 'chave');
  if (ok) logChange('Configurações', 'Capacidade por linha atualizada');
  return ok;
}

function getCapDia(linha) {
  return (CAP_CONFIG[linha] && CAP_CONFIG[linha].dia) ? CAP_CONFIG[linha].dia : {L01:25920,L02:8640,L03:20000}[linha] || 0;
}

// ── HE STATE (sop_he_config) ──────────────────────────────────
// sabados_he = HE, turnos = turnos (stored in same table)
let HE_STATE     = { L01:Array(13).fill(0), L02:Array(13).fill(0), L03:Array(13).fill(0) };
let TURNO_STATE  = { L01:[0,...Array(12).fill(1)], L02:[0,...Array(12).fill(1)], L03:[0,...Array(12).fill(1)] };

async function loadHEConfig() {
  const rows = await dbSelect('sop_he_config', { eq: { ano: 2026 }, order: 'linha' });
  if (rows.length) {
    ['L01','L02','L03'].forEach(l => {
      HE_STATE[l]    = Array(13).fill(0);
      TURNO_STATE[l] = [0, ...Array(12).fill(1)];
    });
    rows.forEach(r => {
      if (HE_STATE[r.linha])    HE_STATE[r.linha][r.mes]    = r.sabados_he || 0;
      if (TURNO_STATE[r.linha]) TURNO_STATE[r.linha][r.mes] = r.turnos || 1;
    });
  }
  return { HE_STATE, TURNO_STATE };
}

async function saveHERow(linha, mes, sabados, turnos) {
  return await dbUpsert('sop_he_config', {
    ano: 2026, linha, mes,
    sabados_he: sabados,
    turnos: turnos,
  }, 'ano,linha,mes');
}

async function saveAllHE() {
  const rows = [];
  ['L01','L02','L03'].forEach(l => {
    for (let m = 1; m <= 12; m++) {
      rows.push({
        ano: 2026, linha: l, mes: m,
        sabados_he: HE_STATE[l][m] || 0,
        turnos:     TURNO_STATE[l][m] || 1,
      });
    }
  });
  const ok = await dbUpsert('sop_he_config', rows, 'ano,linha,mes');
  if (ok) logChange('Supply', 'HE e turnos 2026 atualizados');
  return ok;
}

// ── FATURAMENTO (sop_vendas_semanais) ─────────────────────────
// FAT_CACHE: in-memory only during the session, persisted to Supabase on upload
let FAT_CACHE = null;

async function saveFatToSupabase(fatData) {
  FAT_CACHE = fatData;
  if (!isDbReady()) return false;

  const rows = [];
  const ano  = new Date().getFullYear();
  const MESES_PT = { 'Janeiro':1,'Fevereiro':2,'Março':3,'Marco':3,'Abril':4,'Maio':5,'Junho':6,
                     'Julho':7,'Agosto':8,'Setembro':9,'Outubro':10,'Novembro':11,'Dezembro':12 };

  Object.values(fatData.skus).forEach(s => {
    Object.entries(s.meses).forEach(([mesNome, v]) => {
      const mes = MESES_PT[mesNome] || 0;
      if (!mes) return;
      rows.push({
        sku_codigo:    s.codigo,
        familia:       s.familia,
        descricao:     s.descricao,
        ano,
        mes,
        qtd_cx:        v.qtd_cx  || 0,
        qtd_vendida:   Math.round((v.qtd_cx || 0) * 72),
        receita_bruta: v.receita || 0,
        fonte:         'excel_upload',
        semana_ref:    new Date().toISOString().split('T')[0],
      });
    });
  });

  // Delete existing data for same ano before re-inserting
  await dbDelete('sop_vendas_semanais', { ano });
  return await dbUpsert('sop_vendas_semanais', rows, 'sku_codigo,ano,mes');
}

async function loadFatFromSupabase(ano) {
  ano = ano || new Date().getFullYear();
  const rows = await dbSelect('sop_vendas_semanais', { eq: { ano }, order: 'mes', asc: true });
  if (!rows.length) return null;

  const mesesIdx  = [...new Set(rows.map(r => r.mes))].sort((a,b)=>a-b);
  const MESES_REV = ['','Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                     'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const mesesNomes = mesesIdx.map(m => MESES_REV[m]);

  const skus = {};
  rows.forEach(r => {
    if (!skus[r.sku_codigo]) {
      skus[r.sku_codigo] = { codigo:r.sku_codigo, familia:r.familia||'', descricao:r.descricao||'', meses:{}, total_cx:0, total_receita:0 };
    }
    const nome = MESES_REV[r.mes] || String(r.mes);
    skus[r.sku_codigo].meses[nome] = { qtd_cx: r.qtd_cx||0, receita: r.receita_bruta||0 };
    skus[r.sku_codigo].total_cx      += r.qtd_cx || 0;
    skus[r.sku_codigo].total_receita += r.receita_bruta || 0;
  });

  FAT_CACHE = { skus, meses: mesesNomes, parsed_at: rows[0]?.criado_em || new Date().toISOString(), from_db: true };
  return FAT_CACHE;
}

// ── ESTOQUE (sop_estoque_semanal) ─────────────────────────────
let ESTOQUE_CACHE = null;

async function saveEstoqueToSupabase(parsed, nomeArquivo) {
  ESTOQUE_CACHE = parsed;
  if (!isDbReady()) return false;

  const dataRef = new Date().toISOString().split('T')[0];
  // Log upload entry
  const { data: upData } = await db.from('sop_uploads').insert({
    tipo: 'estoque', arquivo_nome: nomeArquivo,
    semana_ref: dataRef, total_skus: parsed.length, status: 'ok',
  }).select('id').single();
  const uploadId = upData?.id;

  const rows = parsed.map(r => ({
    sku_codigo:     r.sku,
    semana_ref:     dataRef,
    estoque_caixas: r.estoque_cx || 0,
    estoque_unid:   Math.round((r.estoque_cx || 0) * (r.un_cx || 72)),
    pedidos_caixas: r.pedidos_cx || 0,
    pedidos_unid:   Math.round((r.pedidos_cx || 0) * (r.un_cx || 72)),
    saldo_caixas:   (r.estoque_cx || 0) - (r.pedidos_cx || 0),
    saldo_unid:     Math.round(((r.estoque_cx||0) - (r.pedidos_cx||0)) * (r.un_cx || 72)),
    un_por_cx:      r.un_cx || 72,
    fonte:          'excel_upload',
    upload_id:      uploadId || null,
  }));

  return await dbUpsert('sop_estoque_semanal', rows, 'sku_codigo,semana_ref');
}

async function loadEstoqueFromSupabase() {
  // Get the most recent semana_ref
  const latest = await dbSelect('sop_estoque_semanal', { order:'semana_ref', asc:false, limit:1 });
  if (!latest.length) return null;
  const dataRef = latest[0].semana_ref;
  const rows = await dbSelect('sop_estoque_semanal', { eq:{ semana_ref: dataRef }, order:'sku_codigo' });
  ESTOQUE_CACHE = rows.map(r => ({
    sku:        r.sku_codigo,
    desc:       r.descricao || '',
    estoque_cx: r.estoque_caixas,
    pedidos_cx: r.pedidos_caixas,
    un_cx:      r.un_por_cx || 72,
    data_ref:   r.semana_ref,
  }));
  return { rows: ESTOQUE_CACHE, data_ref: dataRef };
}

// ── UPLOAD TIMESTAMPS (from sop_uploads table) ────────────────
const _uploadTsCache = {};

async function getUploadTs(tipo) {
  if (_uploadTsCache[tipo]) return _uploadTsCache[tipo];
  const rows = await dbSelect('sop_uploads', { eq:{ tipo }, order:'criado_em', asc:false, limit:1 });
  const ts = rows[0]?.criado_em || null;
  _uploadTsCache[tipo] = ts;
  return ts;
}

async function setUploadTs(tipo, nomeArquivo, totalSkus) {
  _uploadTsCache[tipo] = new Date().toISOString();
  return await dbUpsert('sop_uploads', {
    tipo, arquivo_nome: nomeArquivo || tipo,
    semana_ref: new Date().toISOString().split('T')[0],
    total_skus: totalSkus || 0, status: 'ok',
  }, 'tipo');
}

async function formatUploadTs(tipo) {
  const ts = await getUploadTs(tipo);
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'});
}

// ── CALENDARIO / SAZONALIDADE (sop_config_geral) ──────────────
const DIAS_UTEIS_DEFAULT   = [0,21,18,22,20,21,21,23,22,21,22,21,17];
const SAZONALIDADE_DEFAULT = [0,.65,.66,.92,1.11,.97,1.07,1.21,1.12,1.22,1.09,1.16,.82];
let DIAS_UTEIS   = [...DIAS_UTEIS_DEFAULT];
let SAZONALIDADE = [...SAZONALIDADE_DEFAULT];

async function loadCalendario() {
  const rows = await dbSelect('sop_config_geral', { like: { chave: 'cal_%' } });
  rows.forEach(r => {
    const m = parseInt(r.chave.split('_')[1]);
    if (m >= 1 && m <= 12) DIAS_UTEIS[m] = Number(r.valor);
  });
  const sazRows = await dbSelect('sop_config_geral', { like: { chave: 'saz_%' } });
  sazRows.forEach(r => {
    const m = parseInt(r.chave.split('_')[1]);
    if (m >= 1 && m <= 12) SAZONALIDADE[m] = Number(r.valor);
  });
  return { DIAS_UTEIS, SAZONALIDADE };
}

async function saveCalendario(dias) {
  const rows = dias.slice(1).map((v, i) => ({ chave: `cal_${i+1}`, valor: String(v), tipo: 'number' }));
  const ok = await dbUpsert('sop_config_geral', rows, 'chave');
  if (ok) { DIAS_UTEIS = dias; logChange('Configurações', 'Calendário de dias úteis atualizado'); }
  return ok;
}

async function saveSazonalidade(saz) {
  const rows = saz.slice(1).map((v, i) => ({ chave: `saz_${i+1}`, valor: String(v), tipo: 'number' }));
  const ok = await dbUpsert('sop_config_geral', rows, 'chave');
  if (ok) { SAZONALIDADE = saz; logChange('Configurações', 'Índices de sazonalidade atualizados'); }
  return ok;
}

async function saveExpedicao(cfg) {
  const rows = Object.entries(cfg).map(([k,v]) => ({ chave:`exp_${k}`, valor:String(v), tipo:'number' }));
  return await dbUpsert('sop_config_geral', rows, 'chave');
}

async function saveAvancado(cfg) {
  const rows = Object.entries(cfg).map(([k,v]) => ({ chave:`adv_${k}`, valor:String(v), tipo:'text' }));
  return await dbUpsert('sop_config_geral', rows, 'chave');
}

// ── CHANGELOG (sop_changelog) ─────────────────────────────────
// Username: only thing in localStorage (it's a UI preference, not data)
function getLogUser() { return localStorage.getItem('odara-log-user') || 'Usuário'; }
function setLogUser(n) { localStorage.setItem('odara-log-user', n); }

async function logChange(modulo, descricao, detalhe) {
  if (!isDbReady()) return;
  try {
    await db.from('sop_changelog').insert({
      usuario: getLogUser(), modulo, descricao, detalhe: detalhe || null,
      criado_em: new Date().toISOString(),
    });
  } catch(e) { console.warn('logChange error:', e); }
}

async function getLogs(limit) {
  let rows = await dbSelect('sop_changelog', { order: 'criado_em', asc: false, limit: limit || 200 });
  return rows;
}

// ── GOVERNANÇA ETAPAS ─────────────────────────────────────────
async function saveEtapaDate(etapa, value) {
  const ok = await dbUpsert('sop_governanca_etapas',
    { ciclo_id: null, numero: etapa, data_prevista: value, nome: 'Etapa ' + etapa },
    'ciclo_id,numero'
  );
  // Also try to update by direct query matching mes=3 ano=2026
  if (isDbReady()) {
    await db.from('sop_governanca_etapas')
      .update({ data_prevista: value })
      .eq('numero', etapa);
    logChange('Governança', `Data etapa ${etapa} atualizada`, value);
    showToast('Data salva no Supabase', 'ok');
  } else {
    showToast('Supabase não conectado', 'error');
  }
}

// ── Navigation ────────────────────────────────────────────────
const NAV = [
  { group:'EXECUÇÃO' },
  { id:'visao-geral', href:'index.html',      icon:'◈', label:'Visão Geral'          },
  { id:'governanca',  href:'governanca.html',  icon:'○', label:'Governança S&OP'     },
  { group:'ANÁLISE' },
  { id:'demanda',     href:'demanda.html',     icon:'◉', label:'Demanda / Assertiv.' },
  { id:'supply',      href:'supply.html',      icon:'⬡', label:'Supply / Capacidade' },
  { id:'estoque',     href:'estoque.html',     icon:'☰', label:'Estoque & Serviço'   },
  { id:'financeiro',  href:'financeiro.html',  icon:'◫', label:'Financeiro', stub:true },
  { group:'DECISÃO' },
  { id:'cenarios',    href:'cenarios.html',    icon:'⚖', label:'Cenários',   stub:true },
  { id:'portfolio',   href:'portfolio.html',   icon:'◰', label:'Portfólio',  stub:true },
  { id:'acoes',       href:'acoes.html',       icon:'✓', label:'Ações',      stub:true },
  { group:'SISTEMA' },
  { id:'dados',       href:'dados.html',       icon:'⊞', label:'Dados & Sync'        },
  { id:'config',      href:'config.html',      icon:'⚙', label:'Configurações'       },
  { id:'log',         href:'log.html',         icon:'≡', label:'Log de Alterações'   },
];

function renderNav(activeId, alertCount) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const dbDot = isDbReady()
    ? '<span style="color:var(--verde);font-size:.6rem" title="Supabase conectado">●</span>'
    : '<span style="color:var(--vermelho);font-size:.6rem" title="Supabase não conectado — configure em Dados & Sync">●</span>';

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="brand">Odara</div>
      <div class="sub">S&amp;OP · 2026 ${dbDot}</div>
    </div>
    <nav class="sidebar-nav">
      ${NAV.map(item => {
        if (item.group) return `<div class="nav-group-label">${item.group}</div>`;
        const active = item.id === activeId ? 'active' : '';
        const stub   = item.stub ? 'stub' : '';
        const badge  = item.id === 'visao-geral' && alertCount > 0
          ? `<span class="nav-badge">${alertCount}</span>` : '';
        return `<a href="${item.href}" class="nav-item ${active} ${stub}">
          <span class="nav-icon">${item.icon}</span>
          <span>${item.label}</span>${badge}
        </a>`;
      }).join('')}
    </nav>
    <div class="sidebar-footer">
      <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()">
        ${getTheme() === 'dark' ? '☀ Claro' : '◑ Escuro'}
      </button>
      <div class="sidebar-meta-row">
        <span>Semana</span><span class="val">${getWeekRef()}</span>
      </div>
      <div class="sidebar-meta-row">
        <span>DB</span>
        <span class="val" style="color:${isDbReady()?'var(--verde)':'var(--vermelho)'}">
          ${isDbReady() ? 'conectado' : 'offline'}
        </span>
      </div>
    </div>`;
}

// ── No-DB warning banner ──────────────────────────────────────
function renderNoDbBanner() {
  if (isDbReady()) return;
  const existing = document.getElementById('_nodb_banner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = '_nodb_banner';
  banner.style.cssText = [
    'position:fixed;top:0;left:0;right:0;z-index:500;padding:8px 16px 8px calc(var(--sidebar-w) + 16px)',
    'background:var(--vermelho-dim);border-bottom:1px solid rgba(238,39,55,.3)',
    'font-family:var(--font-mono);font-size:.72rem;color:#FF7B85;display:flex;align-items:center;gap:10px'
  ].join(';');
  banner.innerHTML = `🔴 <strong>Supabase não conectado</strong> — dados não serão salvos.
    <a href="dados.html" style="color:inherit;text-decoration:underline;margin-left:4px">Configurar credenciais →</a>`;
  document.body.appendChild(banner);
  // Push page header down
  const header = document.querySelector('.page-header');
  if (header) header.style.top = '36px';
}

// ── MOCK DATA (fallback visual — não salvo em lugar nenhum) ───
const MOCK = {
  mensal: [
    {mes:1, label:'Jan',vol_real:535000,vol_prev:560000,rec_real:1940000,rec_prev:2030000,is_actual:true},
    {mes:2, label:'Fev',vol_real:580000,vol_prev:550000,rec_real:2100000,rec_prev:1990000,is_actual:true},
    {mes:3, label:'Mar',vol_real:810000,vol_prev:840000,rec_real:2900000,rec_prev:3040000,is_actual:true},
    {mes:4, label:'Abr',vol_real:null,vol_prev:930000,rec_real:null,rec_prev:3380000,is_actual:false},
    {mes:5, label:'Mai',vol_real:null,vol_prev:813000,rec_real:null,rec_prev:2950000,is_actual:false},
    {mes:6, label:'Jun',vol_real:null,vol_prev:897000,rec_real:null,rec_prev:3250000,is_actual:false},
    {mes:7, label:'Jul',vol_real:null,vol_prev:1015000,rec_real:null,rec_prev:3680000,is_actual:false},
    {mes:8, label:'Ago',vol_real:null,vol_prev:939000,rec_real:null,rec_prev:3410000,is_actual:false},
    {mes:9, label:'Set',vol_real:null,vol_prev:1023000,rec_real:null,rec_prev:3710000,is_actual:false},
    {mes:10,label:'Out',vol_real:null,vol_prev:914000,rec_real:null,rec_prev:3315000,is_actual:false},
    {mes:11,label:'Nov',vol_real:null,vol_prev:972000,rec_real:null,rec_prev:3520000,is_actual:false},
    {mes:12,label:'Dez',vol_real:null,vol_prev:688000,rec_real:null,rec_prev:2495000,is_actual:false},
  ],
  cobertura: [
    {sku:'PP01001',desc:'Clássico Tradicional',familia:'PP - CLASSICO', linha:'L01',estoque_un:156000,pedidos_un:45000,dem_sem:64273,cob_sem:1.7,status:'atencao'},
    {sku:'PP02001',desc:'Clássico Branco',     familia:'PP - CLASSICO', linha:'L01',estoque_un:88000, pedidos_un:22000,dem_sem:40420,cob_sem:1.6,status:'atencao'},
    {sku:'PP05001',desc:'Clássico Dark',        familia:'PP - CLASSICO', linha:'L01',estoque_un:12000, pedidos_un:18000,dem_sem:9589, cob_sem:0.6,status:'critico'},
    {sku:'PP03001',desc:'Mini Tradicional',     familia:'PP - MINI ALFAJOR',linha:'L02',estoque_un:95000,pedidos_un:12000,dem_sem:17440,cob_sem:4.8,status:'ok'},
    {sku:'PP03008',desc:'Mini Duplo',           familia:'PP - MINI ALFAJOR',linha:'L02',estoque_un:18000,pedidos_un:2000, dem_sem:1369, cob_sem:11.7,status:'ok'},
    {sku:'PP29001',desc:'Zero Tradicional',     familia:'PP - CLASSICO', linha:'L02',estoque_un:8500,  pedidos_un:9200, dem_sem:5620, cob_sem:0.8,status:'critico'},
    {sku:'PP30001',desc:'Zero Branco',          familia:'PP - CLASSICO', linha:'L02',estoque_un:14200, pedidos_un:3500, dem_sem:5693, cob_sem:1.9,status:'atencao'},
    {sku:'PP26001',desc:'Crocante Prestígio',   familia:'PP - CROCANTE', linha:'L03',estoque_un:72000, pedidos_un:8000, dem_sem:8582, cob_sem:7.4,status:'ok'},
    {sku:'PP27001',desc:'Crocante Galak',       familia:'PP - CROCANTE', linha:'L03',estoque_un:68000, pedidos_un:6000, dem_sem:8597, cob_sem:7.2,status:'ok'},
    {sku:'PP18001',desc:'Crocante Avelã',       familia:'PP - CROCANTE', linha:'L03',estoque_un:45000, pedidos_un:4000, dem_sem:4065, cob_sem:10.1,status:'ok'},
    {sku:'PP20001',desc:'Crocante Milk',        familia:'PP - CROCANTE', linha:'L03',estoque_un:38000, pedidos_un:3000, dem_sem:3094, cob_sem:11.3,status:'ok'},
    {sku:'PP19001',desc:'Crocante Paçoca',      familia:'PP - CROCANTE', linha:'L03',estoque_un:22000, pedidos_un:2000, dem_sem:2143, cob_sem:9.3,status:'ok'},
  ],
  utilizacao: { L01:[67,68,95,114,100,110,125,116,126,113,120,85], L02:[72,73,102,123,107,118,134,124,135,121,128,91], L03:[65,70,88,106,93,102,116,107,118,105,112,79] },
  fa_history:[
    {label:'Out/25',wmape:14.2,fa:85.8,bias:-3.1},{label:'Nov/25',wmape:12.8,fa:87.2,bias:-1.8},
    {label:'Dez/25',wmape:16.4,fa:83.6,bias:4.2}, {label:'Jan/26',wmape:11.3,fa:88.7,bias:-2.4},
    {label:'Fev/26',wmape:9.8, fa:90.2,bias:1.1}, {label:'Mar/26',wmape:8.2, fa:91.8,bias:0.4},
  ],
  bias_familia:[
    {familia:'Clássico', bias:-3.8,vol_prev:278000,vol_real:267000},
    {familia:'Mini',     bias:6.2, vol_prev:84000, vol_real:89200},
    {familia:'Zero',     bias:-1.4,vol_prev:72000, vol_real:70990},
    {familia:'Crocante', bias:2.1, vol_prev:198000,vol_real:202200},
    {familia:'Dr Peanut',bias:-5.3,vol_prev:208000,vol_real:196900},
  ],
  servico:{otif_atual:94.2,otif_meta:98,fill_rate:96.8,fill_meta:99,rupturas:2,excessos:3,slow_movers:1},
  plano_irrestrito:[560000,550000,840000,1020000,890000,980000,1110000,1030000,1130000,995000,1065000,760000],
  plano_restrito:  [535000,580000,810000,930000, 813000,897000,1015000,939000, 1023000,914000,972000, 688000],
};
MOCK.rec_ytd   = MOCK.mensal.filter(m=>m.is_actual).reduce((s,m)=>s+(m.rec_real||0),0);
MOCK.vol_ytd   = MOCK.mensal.filter(m=>m.is_actual).reduce((s,m)=>s+(m.vol_real||0),0);
MOCK.rec_prev  = MOCK.mensal.reduce((s,m)=>s+m.rec_prev,0);
MOCK.vol_prev  = MOCK.mensal.reduce((s,m)=>s+m.vol_prev,0);
MOCK.skus_criticos = MOCK.cobertura.filter(c=>c.status==='critico').length;
MOCK.skus_atencao  = MOCK.cobertura.filter(c=>c.status==='atencao').length;
MOCK.cob_media = MOCK.cobertura.reduce((s,c)=>s+c.cob_sem,0)/MOCK.cobertura.length;
MOCK.fa_atual  = MOCK.fa_history.at(-1).wmape;
MOCK.bias_atual= MOCK.fa_history.at(-1).bias;

// ── Constants ─────────────────────────────────────────────────
const MESES = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const SKU_LINHA = {
  L01:['PP01001','PP02001','PP05001','PP09001','PP10001','PP11001'],
  L02:['PP03001','PP03008','PP29001','PP30001'],
  L03:['PP26001','PP27001','PP18001','PP20001','PP19001','PP12001','PP15001','PP21001','PP22001','PP28001'],
};
const DEM_SEMANAL = {
  PP01001:69862,PP02001:43935,PP05001:10423,PP03001:18956,PP03008:1488,
  PP29001:6109,PP30001:6188,PP26001:9328,PP27001:9344,PP18001:4418,
  PP20001:3365,PP19001:2330,
};
const TICKET = {
  PP01001:3.41,PP02001:3.46,PP05001:4.86,PP03001:1.67,PP03008:3.40,
  PP29001:4.86,PP30001:4.86,PP26001:3.39,PP27001:3.39,PP18001:2.87,
  PP20001:2.82,PP19001:2.72,
};
const DR_PEANUT = [0,0,215000,260000,280000,220000,240000,180000,180000,180000,180000,180000,180000];

// ── Calculation helpers ───────────────────────────────────────
function calcDemandaMensal(linha, mes) {
  const saz  = SAZONALIDADE[mes] || 1;
  const skus = SKU_LINHA[linha] || [];
  let t = skus.reduce((s,sku) => s + (DEM_SEMANAL[sku]||0)*saz*4.333, 0);
  if (linha === 'L03') t += DR_PEANUT[mes] || 0;
  return Math.round(t);
}
function calcCapMensal(linha, mes, he) {
  return getCapDia(linha) * (DIAS_UTEIS[mes] + (he||0));
}
function calcCapMensalTotal(linha, mes, he) {
  const fator = (TURNO_STATE[linha] && TURNO_STATE[linha][mes]) ? TURNO_STATE[linha][mes] : 1;
  return Math.round(getCapDia(linha) * fator * (DIAS_UTEIS[mes] + (he||0)));
}
function calcOcupacao(linha, mes, he) {
  const d = calcDemandaMensal(linha, mes), c = calcCapMensal(linha, mes, he||0);
  return c > 0 ? d/c*100 : 0;
}
function calcOcupacaoTotal(linha, mes, he) {
  const d = calcDemandaMensal(linha, mes), c = calcCapMensalTotal(linha, mes, he||0);
  return c > 0 ? d/c*100 : 0;
}

// ── Faturamento parser ────────────────────────────────────────
function parseFaturamentoXLSX(rows) {
  const MONTH_NAMES_PT = ['janeiro','fevereiro','marco','abril','maio','junho',
                          'julho','agosto','setembro','outubro','novembro','dezembro'];
  function normM(s) {
    return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }
  let monthRowIdx = -1;
  for (let i = 0; i < Math.min(12, rows.length); i++) {
    if ((rows[i]||[]).some(c => MONTH_NAMES_PT.includes(normM(c)))) { monthRowIdx=i; break; }
  }
  if (monthRowIdx < 0) monthRowIdx = 7;
  const monthRow = rows[monthRowIdx] || [];
  const monthCols = [];
  for (let c=0; c<monthRow.length; c++) {
    if (MONTH_NAMES_PT.includes(normM(monthRow[c]))) {
      monthCols.push({ nome: String(monthRow[c]).trim(), colR: c, colQ: c+1 });
    }
  }
  const skus = {};
  let familiaAtual = '';
  for (let r = monthRowIdx+2; r < rows.length; r++) {
    const row = rows[r] || [];
    if (row.every(c => c===''||c===null||c===undefined)) continue;
    const col0 = String(row[0]||'').trim();
    const col1 = String(row[1]||'').trim();
    const col2 = String(row[2]||'').trim();
    if (col0.toLowerCase().includes('total geral')) break;
    if (col0) familiaAtual = col0;
    if (!col1.match(/^[A-Za-z]{2}\d{2,}/)) continue;
    const meses = {};
    monthCols.forEach(mc => {
      meses[mc.nome] = {
        receita: parseFloat(String(row[mc.colR]||'0').replace(',','.')) || 0,
        qtd_cx:  parseFloat(String(row[mc.colQ]||'0').replace(',','.')) || 0,
      };
    });
    const tR = parseFloat(String(row[9]||'0').replace(',','.')) || 0;
    const tQ = parseFloat(String(row[10]||'0').replace(',','.')) || 0;
    if (tR > 0 || tQ > 0 || Object.values(meses).some(m=>m.receita>0||m.qtd_cx>0)) {
      skus[col1] = { codigo:col1, descricao:col2, familia:familiaAtual, meses, total_receita:tR, total_cx:tQ };
    }
  }
  return { skus, meses: monthCols.map(m=>m.nome), parsed_at: new Date().toISOString() };
}

// ── String / number normalizers ───────────────────────────────
function normStr(s) {
  return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
}
function normSku(v) { return String(v||'').trim().toUpperCase(); }
function parseNum(v) { return parseFloat(String(v||'0').replace(',','.')) || 0; }
function findCol(headers, names) {
  for (const name of names) {
    const nNorm = normStr(name);
    let i = headers.findIndex(h => normStr(h) === nNorm);             if (i>=0) return i;
    i = headers.findIndex(h => normStr(h).startsWith(nNorm));         if (i>=0) return i;
    if (nNorm.length >= 4) { i = headers.findIndex(h => normStr(h).includes(nNorm)); if (i>=0) return i; }
  }
  return -1;
}

// ── Formatting ────────────────────────────────────────────────
function formatBRL(v) {
  if (v>=1e6) return `R$ ${(v/1e6).toFixed(1)}M`;
  if (v>=1e3) return `R$ ${(v/1e3).toFixed(0)}K`;
  return `R$ ${(v||0).toFixed(0)}`;
}
function formatInt(v) { return new Intl.NumberFormat('pt-BR').format(Math.round(v||0)); }
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function formatTs(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
}
function getWeekRef() {
  const t=new Date(), day=t.getDay(), diff=t.getDate()-day+(day===0?-6:1);
  const m = new Date(new Date(t).setDate(diff));
  return `${String(m.getDate()).padStart(2,'0')}/${String(m.getMonth()+1).padStart(2,'0')}`;
}

// ── Visual helpers ────────────────────────────────────────────
function heatClass(pct) {
  if (pct>105) return 'heat-crit';
  if (pct>95)  return 'heat-high';
  if (pct>85)  return 'heat-warn';
  return 'heat-ok';
}
function coverageBg(c) {
  if (c<1) return 'var(--vermelho)';
  if (c<2) return 'var(--laranja)';
  if (c<4) return 'var(--amarelo)';
  return 'var(--verde)';
}
function coverageClass(status) {
  return status==='critico'?'critico':status==='atencao'?'atencao':'ok';
}

// ── Init ──────────────────────────────────────────────────────
async function initApp(activeId) {
  applyTheme(getTheme());
  initSupabase();
  setChartDefaults();

  // Load all config from Supabase in parallel
  if (isDbReady()) {
    await Promise.all([
      loadMetas(),
      loadCapConfig(),
      loadHEConfig(),
      loadCalendario(),
    ]);
  }

  const alertCount = MOCK.skus_criticos + MOCK.skus_atencao;
  renderNav(activeId, alertCount);
  renderNoDbBanner();
}
