/* ══════════════════════════════════════════════════════════════
   ODARA S&OP — app.js v2
   Shared: Supabase client · Nav · Mock Data · Helpers · Theme
══════════════════════════════════════════════════════════════ */

// ── Supabase ─────────────────────────────────────────────────
let db = null;
function initSupabase() {
  try { db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }
  catch(e) { console.warn('Supabase offline:', e); }
}

// ── Theme ─────────────────────────────────────────────────────
function getTheme() { return localStorage.getItem('odara-theme') || 'dark'; }
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('odara-theme', t);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = t === 'dark' ? '☀ Claro' : '◑ Escuro';
  if (typeof Chart !== 'undefined') {
    const textColor = t === 'light' ? '#555' : '#888';
    const gridColor = t === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
    Chart.defaults.color       = textColor;
    Chart.defaults.borderColor = gridColor;
    // Re-render active charts if needed
  }
}
function toggleTheme() { applyTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

// ── Chart.js defaults ─────────────────────────────────────────
function setChartDefaults() {
  if (typeof Chart === 'undefined') return;
  const t = getTheme();
  Chart.defaults.color       = t === 'light' ? '#555' : '#888';
  Chart.defaults.borderColor = t === 'light' ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)';
  Chart.defaults.font.family = "'JetBrains Mono', monospace";
  Chart.defaults.font.size   = 11;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.legend.labels.padding  = 12;
  Chart.defaults.plugins.tooltip.backgroundColor = t === 'light' ? '#fff' : '#1A1A1A';
  Chart.defaults.plugins.tooltip.borderColor     = t === 'light' ? '#ddd' : '#333';
  Chart.defaults.plugins.tooltip.borderWidth     = 1;
  Chart.defaults.plugins.tooltip.titleColor      = t === 'light' ? '#111' : '#EEE';
  Chart.defaults.plugins.tooltip.bodyColor       = t === 'light' ? '#555' : '#999';
  Chart.defaults.plugins.tooltip.padding         = 10;
  Chart.defaults.plugins.tooltip.titleFont = { family:"'Barlow Semi Condensed'", size:12, weight:'700' };
  Chart.defaults.plugins.tooltip.bodyFont  = { family:"'JetBrains Mono'", size:11 };
}

// ── Navigation ────────────────────────────────────────────────
const NAV = [
  { group: 'EXECUÇÃO' },
  { id:'visao-geral',   href:'index.html',      icon:'◈', label:'Visão Geral'       },
  { id:'governanca',    href:'governanca.html',  icon:'○', label:'Governança S&OP',  stub:true },
  { group: 'ANÁLISE' },
  { id:'demanda',       href:'demanda.html',     icon:'◉', label:'Demanda'           },
  { id:'supply',        href:'supply.html',      icon:'⬡', label:'Supply'            },
  { id:'estoque',       href:'estoque.html',     icon:'☰', label:'Estoque & Serviço' },
  { id:'financeiro',    href:'financeiro.html',  icon:'◫', label:'Financeiro',        stub:true },
  { group: 'DECISÃO' },
  { id:'cenarios',      href:'cenarios.html',    icon:'⚖', label:'Cenários',          stub:true },
  { id:'portfolio',     href:'portfolio.html',   icon:'◰', label:'Portfólio',         stub:true },
  { id:'acoes',         href:'acoes.html',       icon:'✓', label:'Ações',             stub:true },
];

function renderNav(activeId, alertCount = 0) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const semana = getWeekRef();
  const navItems = NAV.map(item => {
    if (item.group) return `<div class="nav-group-label">${item.group}</div>`;
    const active = item.id === activeId ? 'active' : '';
    const stub   = item.stub ? 'stub' : '';
    const badge  = item.id === 'visao-geral' && alertCount > 0
      ? `<span class="nav-badge">${alertCount}</span>` : '';
    return `<a href="${item.href}" class="nav-item ${active} ${stub}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>${badge}
    </a>`;
  }).join('');

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="brand">Odara</div>
      <div class="sub">S&amp;OP · 2026</div>
    </div>
    <nav class="sidebar-nav">${navItems}</nav>
    <div class="sidebar-footer">
      <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()">
        ${getTheme() === 'dark' ? '☀ Claro' : '◑ Escuro'}
      </button>
      <div class="sidebar-meta-row"><span>Semana ref.</span><span class="val">${semana}</span></div>
      <div class="sidebar-meta-row"><span>Última sincr.</span><span class="val" id="meta-sync">—</span></div>
    </div>`;

  fetchLastSync();
}

async function fetchLastSync() {
  if (!db) return;
  try {
    const { data } = await db.from('sop_uploads').select('criado_em')
      .order('criado_em', { ascending: false }).limit(1).single();
    if (data) {
      const el = document.getElementById('meta-sync');
      if (el) el.textContent = formatDate(data.criado_em);
    }
  } catch(_) {}
}

// ── MOCK DATA (S&OP coerente com plano Odara 2026) ────────────
const MOCK = {

  // 12 meses: Jan-Mar actual, Abr-Dez forecast
  // volumes em unidades, receita em R$
  mensal: [
    { mes:1,  label:'Jan', vol_real:  535_000, vol_prev:  560_000, rec_real:1_940_000, rec_prev:2_030_000, is_actual:true  },
    { mes:2,  label:'Fev', vol_real:  580_000, vol_prev:  550_000, rec_real:2_100_000, rec_prev:1_990_000, is_actual:true  },
    { mes:3,  label:'Mar', vol_real:  810_000, vol_prev:  840_000, rec_real:2_900_000, rec_prev:3_040_000, is_actual:true  },
    { mes:4,  label:'Abr', vol_real:null,       vol_prev:  930_000, rec_real:null,       rec_prev:3_380_000, is_actual:false },
    { mes:5,  label:'Mai', vol_real:null,       vol_prev:  813_000, rec_real:null,       rec_prev:2_950_000, is_actual:false },
    { mes:6,  label:'Jun', vol_real:null,       vol_prev:  897_000, rec_real:null,       rec_prev:3_250_000, is_actual:false },
    { mes:7,  label:'Jul', vol_real:null,       vol_prev:1_015_000, rec_real:null,       rec_prev:3_680_000, is_actual:false },
    { mes:8,  label:'Ago', vol_real:null,       vol_prev:  939_000, rec_real:null,       rec_prev:3_410_000, is_actual:false },
    { mes:9,  label:'Set', vol_real:null,       vol_prev:1_023_000, rec_real:null,       rec_prev:3_710_000, is_actual:false },
    { mes:10, label:'Out', vol_real:null,       vol_prev:  914_000, rec_real:null,       rec_prev:3_315_000, is_actual:false },
    { mes:11, label:'Nov', vol_real:null,       vol_prev:  972_000, rec_real:null,       rec_prev:3_520_000, is_actual:false },
    { mes:12, label:'Dez', vol_real:null,       vol_prev:  688_000, rec_real:null,       rec_prev:2_495_000, is_actual:false },
  ],

  // Cobertura de estoque por SKU principal
  cobertura: [
    { sku:'PP01001', desc:'Clássico Tradicional', familia:'Clássico',  linha:'L01', estoque_un:156_000, pedidos_un:45_000, dem_sem:64_273, cob_sem:1.7, status:'atencao' },
    { sku:'PP02001', desc:'Clássico Branco',      familia:'Clássico',  linha:'L01', estoque_un: 88_000, pedidos_un:22_000, dem_sem:40_420, cob_sem:1.6, status:'atencao' },
    { sku:'PP05001', desc:'Clássico Dark',         familia:'Clássico',  linha:'L01', estoque_un: 12_000, pedidos_un:18_000, dem_sem: 9_589, cob_sem:0.6, status:'critico' },
    { sku:'PP03001', desc:'Mini Tradicional',      familia:'Mini',      linha:'L02', estoque_un: 95_000, pedidos_un:12_000, dem_sem:17_440, cob_sem:4.8, status:'ok'      },
    { sku:'PP03008', desc:'Mini Duplo',            familia:'Mini',      linha:'L02', estoque_un: 18_000, pedidos_un: 2_000, dem_sem: 1_369, cob_sem:11.7,status:'ok'      },
    { sku:'PP29001', desc:'Zero Tradicional',      familia:'Zero',      linha:'L02', estoque_un:  8_500, pedidos_un: 9_200, dem_sem: 5_620, cob_sem:0.8, status:'critico' },
    { sku:'PP30001', desc:'Zero Branco',           familia:'Zero',      linha:'L02', estoque_un: 14_200, pedidos_un: 3_500, dem_sem: 5_693, cob_sem:1.9, status:'atencao' },
    { sku:'PP26001', desc:'Crocante Prestígio',    familia:'Crocante',  linha:'L03', estoque_un: 72_000, pedidos_un: 8_000, dem_sem: 8_582, cob_sem:7.4, status:'ok'      },
    { sku:'PP27001', desc:'Crocante Galak',        familia:'Crocante',  linha:'L03', estoque_un: 68_000, pedidos_un: 6_000, dem_sem: 8_597, cob_sem:7.2, status:'ok'      },
    { sku:'PP18001', desc:'Crocante Avelã',        familia:'Crocante',  linha:'L03', estoque_un: 45_000, pedidos_un: 4_000, dem_sem: 4_065, cob_sem:10.1,status:'ok'      },
    { sku:'PP20001', desc:'Crocante Milk',         familia:'Crocante',  linha:'L03', estoque_un: 38_000, pedidos_un: 3_000, dem_sem: 3_094, cob_sem:11.3,status:'ok'      },
    { sku:'PP19001', desc:'Crocante Paçoca',       familia:'Crocante',  linha:'L03', estoque_un: 22_000, pedidos_un: 2_000, dem_sem: 2_143, cob_sem:9.3, status:'ok'      },
  ],

  // Utilização % por linha por mês (Jan-Dez)
  utilizacao: {
    L01: [67,  68,  95, 114, 100, 110, 125, 116, 126, 113, 120,  85],
    L02: [72,  73, 102, 123, 107, 118, 134, 124, 135, 121, 128,  91],
    L03: [65,  70,  88, 106,  93, 102, 116, 107, 118, 105, 112,  79],
  },

  // Histórico acuracidade de forecast (últimos 6 meses)
  fa_history: [
    { label:'Out/25', wmape:14.2, fa:85.8, bias:-3.1 },
    { label:'Nov/25', wmape:12.8, fa:87.2, bias:-1.8 },
    { label:'Dez/25', wmape:16.4, fa:83.6, bias: 4.2 },
    { label:'Jan/26', wmape:11.3, fa:88.7, bias:-2.4 },
    { label:'Fev/26', wmape: 9.8, fa:90.2, bias: 1.1 },
    { label:'Mar/26', wmape: 8.2, fa:91.8, bias: 0.4 },
  ],

  // Bias por família (mês atual)
  bias_familia: [
    { familia:'Clássico',   bias:-3.8, vol_prev:278_000, vol_real:267_000 },
    { familia:'Mini',       bias: 6.2, vol_prev: 84_000, vol_real: 89_200 },
    { familia:'Zero',       bias:-1.4, vol_prev: 72_000, vol_real: 70_990 },
    { familia:'Crocante',   bias: 2.1, vol_prev:198_000, vol_real:202_200 },
    { familia:'Dr Peanut',  bias:-5.3, vol_prev:208_000, vol_real:196_900 },
  ],

  // Nível de serviço
  servico: {
    otif_atual:  94.2, otif_meta:  98.0,
    fill_rate:   96.8, fill_meta:  99.0,
    rupturas:        2,
    excessos:        3,
    slow_movers:     1,
  },

  // Plano restrito vs irrestrito L01 (unidades/mês)
  plano_irrestrito: [560_000, 550_000, 840_000, 1_020_000, 890_000, 980_000, 1_110_000, 1_030_000, 1_130_000,  995_000, 1_065_000, 760_000],
  plano_restrito:   [535_000, 580_000, 810_000,   930_000, 813_000, 897_000, 1_015_000,   939_000, 1_023_000,  914_000,   972_000, 688_000],
};

// ── Derived totals ─────────────────────────────────────────────
MOCK.rec_ytd  = MOCK.mensal.filter(m=>m.is_actual).reduce((s,m)=>s+(m.rec_real||0),0);
MOCK.vol_ytd  = MOCK.mensal.filter(m=>m.is_actual).reduce((s,m)=>s+(m.vol_real||0),0);
MOCK.rec_prev = MOCK.mensal.reduce((s,m)=>s+m.rec_prev,0);
MOCK.vol_prev = MOCK.mensal.reduce((s,m)=>s+m.vol_prev,0);
MOCK.meta_ano = 36_400_000;
MOCK.skus_criticos  = MOCK.cobertura.filter(c=>c.status==='critico').length;
MOCK.skus_atencao   = MOCK.cobertura.filter(c=>c.status==='atencao').length;
MOCK.cob_media = MOCK.cobertura.reduce((s,c)=>s+c.cob_sem,0)/MOCK.cobertura.length;
MOCK.fa_atual  = MOCK.fa_history.at(-1).wmape;
MOCK.bias_atual= MOCK.fa_history.at(-1).bias;

// ── Helpers ───────────────────────────────────────────────────
const MESES = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const SAZONALIDADE = [0,.65,.66,.92,1.11,.97,1.07,1.21,1.12,1.22,1.09,1.16,.82];
const DIAS_UTEIS   = [0,21,18,22,20,21,21,23,22,21,22,21,17];
const DEM_SEMANAL  = { PP01001:69862, PP02001:43935, PP05001:10423, PP03001:18956, PP03008:1488, PP29001:6109, PP30001:6188, PP26001:9328, PP27001:9344, PP18001:4418, PP20001:3365, PP19001:2330 };
const TICKET       = { PP01001:3.41, PP02001:3.46, PP05001:4.86, PP03001:1.67, PP03008:3.40, PP29001:4.86, PP30001:4.86, PP26001:3.39, PP27001:3.39, PP18001:2.87, PP20001:2.82, PP19001:2.72 };
const SKU_LINHA    = { L01:['PP01001','PP02001','PP05001'], L02:['PP03001','PP03008','PP29001','PP30001'], L03:['PP26001','PP27001','PP18001','PP20001','PP19001'] };
const CAP_DIA      = { L01:25920, L02:8640, L03:20000 };
const DR_PEANUT    = [0,0,215000,260000,280000,220000,240000,180000,180000,180000,180000,180000,180000];

function calcDemandaMensal(linha, mes) {
  const skus = SKU_LINHA[linha]||[];
  let total  = skus.reduce((s,sku)=>s+(DEM_SEMANAL[sku]||0)*SAZONALIDADE[mes]*4.333,0);
  if (linha==='L03') total += DR_PEANUT[mes]||0;
  return Math.round(total);
}
function calcCapMensal(linha, mes, he=0) { return CAP_DIA[linha]*(DIAS_UTEIS[mes]+he); }
function calcOcupacao(linha, mes, he=0)  { const d=calcDemandaMensal(linha,mes); const c=calcCapMensal(linha,mes,he); return c>0?d/c*100:0; }
function calcReceitaMensal(mes) {
  let t=0;
  ['L01','L02','L03'].forEach(l=>{ (SKU_LINHA[l]||[]).forEach(sku=>{ t+=(DEM_SEMANAL[sku]||0)*SAZONALIDADE[mes]*4.333*(TICKET[sku]||0); }); });
  t += (DR_PEANUT[mes]||0)*2.85;
  return t;
}

// ── Formatting ────────────────────────────────────────────────
function formatBRL(v) {
  if(v>=1_000_000) return `R$ ${(v/1_000_000).toFixed(1)}M`;
  if(v>=1_000)     return `R$ ${(v/1_000).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
}
function formatInt(v) { return new Intl.NumberFormat('pt-BR').format(Math.round(v)); }
function formatDate(iso) {
  if(!iso)return'—';
  const d=new Date(iso);
  return`${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function formatPct(v, decimals=1) { return `${v>=0?'':'-'}${Math.abs(v).toFixed(decimals)}%`; }
function getWeekRef() {
  const t=new Date(), day=t.getDay(), diff=t.getDate()-day+(day===0?-6:1);
  const m=new Date(t.setDate(diff));
  return `${String(m.getDate()).padStart(2,'0')}/${String(m.getMonth()+1).padStart(2,'0')}`;
}

// ── Visual helpers ────────────────────────────────────────────
function heatClass(pct) {
  if(pct>105) return 'heat-crit';
  if(pct> 95) return 'heat-high';
  if(pct> 85) return 'heat-warn';
  return 'heat-ok';
}
function trendIcon(delta) { return delta>0?'▲':delta<0?'▼':'→'; }
function coverageBg(cob) {
  if(cob<1) return 'var(--vermelho)';
  if(cob<2) return 'var(--laranja)';
  if(cob<4) return 'var(--amarelo)';
  return 'var(--verde)';
}
function coverageClass(status) {
  return status==='critico'?'critico':status==='atencao'?'atencao':'ok';
}

// ── Init ──────────────────────────────────────────────────────
function initApp(activeId) {
  applyTheme(getTheme());
  initSupabase();
  setChartDefaults();
  const alertCount = MOCK.skus_criticos + MOCK.skus_atencao;
  renderNav(activeId, alertCount);
}
