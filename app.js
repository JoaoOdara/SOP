/* ══════════════════════════════════════════════════════════════
   ODARA S&OP — app.js v2.1
   Shared: Supabase · Nav · Mock Data · Helpers · Theme
══════════════════════════════════════════════════════════════ */

// ── Supabase ─────────────────────────────────────────────────
let db = null;
function initSupabase() {
  try {
    if (typeof supabase === 'undefined') return;
    if (!SUPABASE_URL || SUPABASE_URL.includes('SEU-') ||
        !SUPABASE_KEY || SUPABASE_KEY.includes('YOUR_')) {
      console.info('Supabase: credenciais não configuradas — modo mock ativo.');
      return;
    }
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.info('Supabase conectado.');
  } catch(e) { console.warn('Supabase offline:', e); }
}
function isDbReady() { return db !== null; }

async function dbGet(table, options={}) {
  if (!isDbReady()) return { data:null, error:{message:'offline'} };
  let q = db.from(table).select(options.select||'*');
  if (options.eq) Object.entries(options.eq).forEach(([k,v])=>q=q.eq(k,v));
  if (options.order) q = q.order(options.order,{ascending:options.asc??false});
  if (options.limit) q = q.limit(options.limit);
  if (options.single) q = q.single();
  return await q;
}
async function dbUpsert(table, rows, conflict='id') {
  if (!isDbReady()) return {error:{message:'offline'}};
  return await db.from(table).upsert(rows,{onConflict:conflict});
}
async function dbDelete(table, match) {
  if (!isDbReady()) return {error:{message:'offline'}};
  let q = db.from(table).delete();
  Object.entries(match).forEach(([k,v])=>q=q.eq(k,v));
  return await q;
}

// ── Theme ─────────────────────────────────────────────────────
function getTheme() { return localStorage.getItem('odara-theme')||'dark'; }
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme',t);
  localStorage.setItem('odara-theme',t);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = t==='dark' ? '☀ Claro' : '◑ Escuro';
}
function toggleTheme() { applyTheme(getTheme()==='dark'?'light':'dark'); }

// ── Chart.js defaults ─────────────────────────────────────────
function setChartDefaults() {
  if (typeof Chart==='undefined') return;
  const t=getTheme();
  const txtColor  = t==='light'?'#555':'#888';
  const gridColor = t==='light'?'rgba(0,0,0,0.06)':'rgba(255,255,255,0.05)';
  Chart.defaults.color       = txtColor;
  Chart.defaults.borderColor = gridColor;
  Chart.defaults.font.family = "'JetBrains Mono',monospace";
  Chart.defaults.font.size   = 11;
  Chart.defaults.plugins.legend.labels.boxWidth  = 8;
  Chart.defaults.plugins.legend.labels.padding   = 12;
  Chart.defaults.plugins.tooltip.backgroundColor = t==='light'?'#fff':'#1C1C1C';
  Chart.defaults.plugins.tooltip.borderColor     = t==='light'?'#ddd':'#333';
  Chart.defaults.plugins.tooltip.borderWidth     = 1;
  Chart.defaults.plugins.tooltip.titleColor      = t==='light'?'#111':'#EEE';
  Chart.defaults.plugins.tooltip.bodyColor       = t==='light'?'#555':'#999';
  Chart.defaults.plugins.tooltip.padding         = 10;
  Chart.defaults.plugins.tooltip.titleFont = {family:"'Barlow Semi Condensed'",size:12,weight:'700'};
}

// ── METAS (padrão — sobrescritas por config.html ao salvar) ──
let METAS = JSON.parse(localStorage.getItem('odara-metas-v2')||'null') || {
  fa_min:        88,    // Forecast Accuracy mínima %
  wmape_max:     12,    // WMAPE máximo %
  cob_min:        2,    // Cobertura mínima semanas
  cob_excesso:    8,    // Cobertura excesso semanas
  otif_meta:     98,    // OTIF meta %
  fill_rate_meta:99,    // Fill Rate meta %
  receita_ano:   36.4,  // Meta receita ano R$ M
  util_max:      95,    // Utilização máxima sem HE %
  bias_max:       5,    // Bias máximo aceitável |%|
};
function saveMetas(m) {
  METAS = m;
  localStorage.setItem('odara-metas-v2', JSON.stringify(m));
  if (isDbReady()) {
    db.from('sop_config_geral').upsert(
      Object.entries(m).map(([k,v])=>({chave:'meta_'+k, valor:String(v)})),
      {onConflict:'chave'}
    );
  }
}
async function loadMetasFromDb() {
  if (!isDbReady()) return;
  const {data} = await dbGet('sop_config_geral',{eq:{chave:null}});
  // load all meta_ keys
  const {data:rows} = await db.from('sop_config_geral').select('chave,valor').like('chave','meta_%');
  if (rows && rows.length) {
    const m = {...METAS};
    rows.forEach(r=>{ const k=r.chave.replace('meta_',''); if(k in m) m[k]=Number(r.valor); });
    METAS = m;
    localStorage.setItem('odara-metas-v2',JSON.stringify(m));
  }
}

// ── Navigation ────────────────────────────────────────────────
const NAV = [
  { group:'EXECUÇÃO' },
  { id:'visao-geral', href:'index.html',      icon:'◈', label:'Visão Geral'       },
  { id:'governanca',  href:'governanca.html',  icon:'○', label:'Governança S&OP', stub:true },
  { group:'ANÁLISE' },
  { id:'demanda',     href:'demanda.html',     icon:'◉', label:'Demanda'           },
  { id:'supply',      href:'supply.html',      icon:'⬡', label:'Supply'            },
  { id:'estoque',     href:'estoque.html',     icon:'☰', label:'Estoque & Serviço' },
  { id:'financeiro',  href:'financeiro.html',  icon:'◫', label:'Financeiro',        stub:true },
  { group:'DECISÃO' },
  { id:'cenarios',    href:'cenarios.html',    icon:'⚖', label:'Cenários',          stub:true },
  { id:'portfolio',   href:'portfolio.html',   icon:'◰', label:'Portfólio',         stub:true },
  { id:'acoes',       href:'acoes.html',       icon:'✓', label:'Ações',             stub:true },
  { group:'SISTEMA' },
  { id:'dados',       href:'dados.html',       icon:'⊞', label:'Dados & Sync'      },
  { id:'config',      href:'config.html',      icon:'⚙', label:'Configurações'     },
];

function renderNav(activeId, alertCount=0) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const dbStatus = isDbReady()
    ? '<span style="color:var(--verde);font-size:.62rem;font-family:var(--font-mono)">● DB</span>'
    : '<span style="color:var(--txt-3);font-size:.62rem;font-family:var(--font-mono)">○ mock</span>';

  const navItems = NAV.map(item=>{
    if (item.group) return `<div class="nav-group-label">${item.group}</div>`;
    const active = item.id===activeId?'active':'';
    const stub   = item.stub?'stub':'';
    const badge  = item.id==='visao-geral'&&alertCount>0
      ? `<span class="nav-badge">${alertCount}</span>`:'';
    return `<a href="${item.href}" class="nav-item ${active} ${stub}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>${badge}
    </a>`;
  }).join('');

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="brand">Odara</div>
      <div class="sub">S&amp;OP · 2026 ${dbStatus}</div>
    </div>
    <nav class="sidebar-nav">${navItems}</nav>
    <div class="sidebar-footer">
      <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()">
        ${getTheme()==='dark'?'☀ Claro':'◑ Escuro'}
      </button>
      <div class="sidebar-meta-row"><span>Semana ref.</span>
        <span class="val">${getWeekRef()}</span></div>
      <div class="sidebar-meta-row"><span>Última sincr.</span>
        <span class="val" id="meta-sync">—</span></div>
    </div>`;

  fetchLastSync();
}

async function fetchLastSync() {
  if (!isDbReady()) return;
  try {
    const {data} = await db.from('sop_uploads').select('criado_em')
      .order('criado_em',{ascending:false}).limit(1).single();
    if (data) {
      const el=document.getElementById('meta-sync');
      if (el) el.textContent=formatDate(data.criado_em);
    }
  } catch(_){}
}

// ── MOCK DATA ─────────────────────────────────────────────────
const MOCK = {
  mensal:[
    {mes:1, label:'Jan',vol_real:535000, vol_prev:560000,rec_real:1940000,rec_prev:2030000,is_actual:true},
    {mes:2, label:'Fev',vol_real:580000, vol_prev:550000,rec_real:2100000,rec_prev:1990000,is_actual:true},
    {mes:3, label:'Mar',vol_real:810000, vol_prev:840000,rec_real:2900000,rec_prev:3040000,is_actual:true},
    {mes:4, label:'Abr',vol_real:null,   vol_prev:930000, rec_real:null,  rec_prev:3380000,is_actual:false},
    {mes:5, label:'Mai',vol_real:null,   vol_prev:813000, rec_real:null,  rec_prev:2950000,is_actual:false},
    {mes:6, label:'Jun',vol_real:null,   vol_prev:897000, rec_real:null,  rec_prev:3250000,is_actual:false},
    {mes:7, label:'Jul',vol_real:null,   vol_prev:1015000,rec_real:null,  rec_prev:3680000,is_actual:false},
    {mes:8, label:'Ago',vol_real:null,   vol_prev:939000, rec_real:null,  rec_prev:3410000,is_actual:false},
    {mes:9, label:'Set',vol_real:null,   vol_prev:1023000,rec_real:null,  rec_prev:3710000,is_actual:false},
    {mes:10,label:'Out',vol_real:null,   vol_prev:914000, rec_real:null,  rec_prev:3315000,is_actual:false},
    {mes:11,label:'Nov',vol_real:null,   vol_prev:972000, rec_real:null,  rec_prev:3520000,is_actual:false},
    {mes:12,label:'Dez',vol_real:null,   vol_prev:688000, rec_real:null,  rec_prev:2495000,is_actual:false},
  ],
  cobertura:[
    {sku:'PP01001',desc:'Clássico Tradicional',familia:'Clássico', linha:'L01',estoque_un:156000,pedidos_un:45000,dem_sem:64273,cob_sem:1.7,status:'atencao'},
    {sku:'PP02001',desc:'Clássico Branco',      familia:'Clássico', linha:'L01',estoque_un:88000, pedidos_un:22000,dem_sem:40420,cob_sem:1.6,status:'atencao'},
    {sku:'PP05001',desc:'Clássico Dark',         familia:'Clássico', linha:'L01',estoque_un:12000, pedidos_un:18000,dem_sem:9589, cob_sem:0.6,status:'critico'},
    {sku:'PP03001',desc:'Mini Tradicional',      familia:'Mini',     linha:'L02',estoque_un:95000, pedidos_un:12000,dem_sem:17440,cob_sem:4.8,status:'ok'},
    {sku:'PP03008',desc:'Mini Duplo',            familia:'Mini',     linha:'L02',estoque_un:18000, pedidos_un:2000, dem_sem:1369, cob_sem:11.7,status:'ok'},
    {sku:'PP29001',desc:'Zero Tradicional',      familia:'Zero',     linha:'L02',estoque_un:8500,  pedidos_un:9200, dem_sem:5620, cob_sem:0.8,status:'critico'},
    {sku:'PP30001',desc:'Zero Branco',           familia:'Zero',     linha:'L02',estoque_un:14200, pedidos_un:3500, dem_sem:5693, cob_sem:1.9,status:'atencao'},
    {sku:'PP26001',desc:'Crocante Prestígio',    familia:'Crocante', linha:'L03',estoque_un:72000, pedidos_un:8000, dem_sem:8582, cob_sem:7.4,status:'ok'},
    {sku:'PP27001',desc:'Crocante Galak',        familia:'Crocante', linha:'L03',estoque_un:68000, pedidos_un:6000, dem_sem:8597, cob_sem:7.2,status:'ok'},
    {sku:'PP18001',desc:'Crocante Avelã',        familia:'Crocante', linha:'L03',estoque_un:45000, pedidos_un:4000, dem_sem:4065, cob_sem:10.1,status:'ok'},
    {sku:'PP20001',desc:'Crocante Milk',         familia:'Crocante', linha:'L03',estoque_un:38000, pedidos_un:3000, dem_sem:3094, cob_sem:11.3,status:'ok'},
    {sku:'PP19001',desc:'Crocante Paçoca',       familia:'Crocante', linha:'L03',estoque_un:22000, pedidos_un:2000, dem_sem:2143, cob_sem:9.3,status:'ok'},
  ],
  utilizacao:{
    L01:[67,68,95,114,100,110,125,116,126,113,120,85],
    L02:[72,73,102,123,107,118,134,124,135,121,128,91],
    L03:[65,70,88,106,93,102,116,107,118,105,112,79],
  },
  fa_history:[
    {label:'Out/25',wmape:14.2,fa:85.8,bias:-3.1},
    {label:'Nov/25',wmape:12.8,fa:87.2,bias:-1.8},
    {label:'Dez/25',wmape:16.4,fa:83.6,bias:4.2},
    {label:'Jan/26',wmape:11.3,fa:88.7,bias:-2.4},
    {label:'Fev/26',wmape:9.8,fa:90.2,bias:1.1},
    {label:'Mar/26',wmape:8.2,fa:91.8,bias:0.4},
  ],
  bias_familia:[
    {familia:'Clássico',  bias:-3.8,vol_prev:278000,vol_real:267000},
    {familia:'Mini',      bias:6.2, vol_prev:84000, vol_real:89200},
    {familia:'Zero',      bias:-1.4,vol_prev:72000, vol_real:70990},
    {familia:'Crocante',  bias:2.1, vol_prev:198000,vol_real:202200},
    {familia:'Dr Peanut', bias:-5.3,vol_prev:208000,vol_real:196900},
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
const MESES        = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const SAZONALIDADE = [0,.65,.66,.92,1.11,.97,1.07,1.21,1.12,1.22,1.09,1.16,.82];
const DIAS_UTEIS   = [0,21,18,22,20,21,21,23,22,21,22,21,17];
const CAP_DIA      = {L01:25920,L02:8640,L03:20000};
const SKU_LINHA    = {L01:['PP01001','PP02001','PP05001'],L02:['PP03001','PP03008','PP29001','PP30001'],L03:['PP26001','PP27001','PP18001','PP20001','PP19001']};
const DEM_SEMANAL  = {PP01001:69862,PP02001:43935,PP05001:10423,PP03001:18956,PP03008:1488,PP29001:6109,PP30001:6188,PP26001:9328,PP27001:9344,PP18001:4418,PP20001:3365,PP19001:2330};
const TICKET       = {PP01001:3.41,PP02001:3.46,PP05001:4.86,PP03001:1.67,PP03008:3.40,PP29001:4.86,PP30001:4.86,PP26001:3.39,PP27001:3.39,PP18001:2.87,PP20001:2.82,PP19001:2.72};
const DR_PEANUT    = [0,0,215000,260000,280000,220000,240000,180000,180000,180000,180000,180000,180000];

// ── Calculation helpers ───────────────────────────────────────
function calcDemandaMensal(linha,mes){
  const skus=SKU_LINHA[linha]||[];
  let t=skus.reduce((s,sku)=>s+(DEM_SEMANAL[sku]||0)*SAZONALIDADE[mes]*4.333,0);
  if(linha==='L03') t+=DR_PEANUT[mes]||0;
  return Math.round(t);
}
function calcCapMensal(linha,mes,he=0){ return CAP_DIA[linha]*(DIAS_UTEIS[mes]+he); }
function calcOcupacao(linha,mes,he=0){ const d=calcDemandaMensal(linha,mes),c=calcCapMensal(linha,mes,he); return c>0?d/c*100:0; }

// ── Formatting ────────────────────────────────────────────────
function formatBRL(v){
  if(v>=1e6) return `R$ ${(v/1e6).toFixed(1)}M`;
  if(v>=1e3) return `R$ ${(v/1e3).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
}
function formatInt(v){ return new Intl.NumberFormat('pt-BR').format(Math.round(v)); }
function formatDate(iso){
  if(!iso)return'—';
  const d=new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}
function getWeekRef(){
  const t=new Date(),day=t.getDay(),diff=t.getDate()-day+(day===0?-6:1);
  const m=new Date(new Date(t).setDate(diff));
  return `${String(m.getDate()).padStart(2,'0')}/${String(m.getMonth()+1).padStart(2,'0')}`;
}

// ── Visual helpers ────────────────────────────────────────────
function heatClass(pct){
  if(pct>105)return'heat-crit';
  if(pct>95) return'heat-high';
  if(pct>85) return'heat-warn';
  return'heat-ok';
}
function coverageBg(c){
  if(c<1)return'var(--vermelho)';
  if(c<2)return'var(--laranja)';
  if(c<4)return'var(--amarelo)';
  return'var(--verde)';
}
function coverageClass(status){
  return status==='critico'?'critico':status==='atencao'?'atencao':'ok';
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg,type='ok',duration=3000){
  let t=document.getElementById('toast');
  if(!t){ t=document.createElement('div'); t.id='toast';
    t.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9999;padding:10px 16px;border-radius:6px;font-family:var(--font-mono);font-size:.78rem;font-weight:600;max-width:360px;opacity:0;transition:opacity .25s';
    document.body.appendChild(t); }
  const colors={ok:'background:var(--verde-dim);color:var(--verde);border:1px solid rgba(34,197,94,.3)',
    error:'background:var(--vermelho-dim);color:#FF7B85;border:1px solid rgba(238,39,55,.3)',
    warn:'background:var(--amarelo-dim);color:var(--amarelo);border:1px solid rgba(255,184,29,.2)'};
  t.style.cssText+=';'+colors[type]||colors.ok;
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.style.opacity='0',duration);
}

// ── Init ──────────────────────────────────────────────────────
async function initApp(activeId){
  applyTheme(getTheme());
  initSupabase();
  setChartDefaults();
  await loadMetasFromDb();
  const alertCount=MOCK.skus_criticos+MOCK.skus_atencao;
  renderNav(activeId,alertCount);
}
