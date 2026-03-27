/* ══════════════════════════════════════════════════════════════
   ODARA S&OP — app.js v2.2
══════════════════════════════════════════════════════════════ */

// ── Supabase ─────────────────────────────────────────────────
let db = null;
function initSupabase() {
  try {
    if (typeof supabase === 'undefined') return;
    if (!SUPABASE_URL || SUPABASE_URL.includes('SEU-') ||
        !SUPABASE_KEY || SUPABASE_KEY.includes('YOUR_')) return;
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch(e) { console.warn('Supabase offline:', e); }
}
function isDbReady() { return db !== null; }

// ── Theme ─────────────────────────────────────────────────────
function getTheme() { return localStorage.getItem('odara-theme') || 'dark'; }
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('odara-theme', t);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.innerHTML = t === 'dark' ? '☀ Claro' : '◑ Escuro';
}
function toggleTheme() { applyTheme(getTheme() === 'dark' ? 'light' : 'dark'); }

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
  Chart.defaults.plugins.tooltip.titleFont = {family:"'Barlow Semi Condensed'",size:12,weight:'700'};
}

// ── METAS ────────────────────────────────────────────────────
let METAS = (() => {
  try { return JSON.parse(localStorage.getItem('odara-metas-v2')) || null; } catch(_) { return null; }
})() || {
  fa_min: 88, wmape_max: 12, cob_min: 2, cob_excesso: 8,
  otif_meta: 98, fill_rate_meta: 99, receita_ano: 36.4,
  util_max: 95, bias_max: 5,
};
function saveMetas(m) {
  METAS = m;
  localStorage.setItem('odara-metas-v2', JSON.stringify(m));
}

// ── CAPACIDADE (config editável) ──────────────────────────────
let CAP_CONFIG = (() => {
  try { return JSON.parse(localStorage.getItem('odara-cap-v2')) || null; } catch(_) { return null; }
})() || { L01:{dia:25920}, L02:{dia:8640}, L03:{dia:20000} };
const CAP_DIA = new Proxy({}, {
  get(_, linha) { return CAP_CONFIG[linha]?.dia || {L01:25920,L02:8640,L03:20000}[linha] || 0; }
});

// ── HE STATE ─────────────────────────────────────────────────
let HE_STATE = (() => {
  try { return JSON.parse(localStorage.getItem('odara-he-v2')) || null; } catch(_) { return null; }
})() || { L01:Array(13).fill(0), L02:Array(13).fill(0), L03:Array(13).fill(0) };
function saveHE() { localStorage.setItem('odara-he-v2', JSON.stringify(HE_STATE)); }

// ── FATURAMENTO CACHE (parsed from Excel uploads) ─────────────
let FAT_CACHE = (() => {
  try { return JSON.parse(localStorage.getItem('odara-fat-cache')) || null; } catch(_) { return null; }
})();
function saveFatCache(data) {
  FAT_CACHE = data;
  localStorage.setItem('odara-fat-cache', JSON.stringify(data));
  localStorage.setItem('odara-fat-upload-ts', new Date().toISOString());
}

// ── UPLOAD TIMESTAMPS ─────────────────────────────────────────
function getUploadTs(tipo) { return localStorage.getItem('odara-upload-ts-'+tipo) || null; }
function setUploadTs(tipo) { localStorage.setItem('odara-upload-ts-'+tipo, new Date().toISOString()); }
function formatUploadTs(tipo) {
  const ts = getUploadTs(tipo);
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
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
];

function renderNav(activeId, alertCount = 0) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  const dbDot = isDbReady()
    ? '<span style="color:var(--verde);font-size:.6rem">●</span>'
    : '<span style="color:var(--txt-3);font-size:.6rem">○</span>';

  const navHtml = NAV.map(item => {
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
      <div class="sub">S&amp;OP · 2026 ${dbDot}</div>
    </div>
    <nav class="sidebar-nav">${navHtml}</nav>
    <div class="sidebar-footer">
      <button class="theme-toggle" id="theme-toggle" onclick="toggleTheme()">
        ${getTheme() === 'dark' ? '☀ Claro' : '◑ Escuro'}
      </button>
      <div class="sidebar-meta-row">
        <span>Semana ref.</span><span class="val">${getWeekRef()}</span>
      </div>
      <div class="sidebar-meta-row">
        <span>Últ. sync</span>
        <span class="val">${formatUploadTs('estoque')}</span>
      </div>
    </div>`;
}

// ── MOCK DATA ─────────────────────────────────────────────────
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
  utilizacao: {
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

// Derived
MOCK.rec_ytd   = MOCK.mensal.filter(m=>m.is_actual).reduce((s,m)=>s+(m.rec_real||0),0);
MOCK.vol_ytd   = MOCK.mensal.filter(m=>m.is_actual).reduce((s,m)=>s+(m.vol_real||0),0);
MOCK.rec_prev  = MOCK.mensal.reduce((s,m)=>s+m.rec_prev,0);
MOCK.vol_prev  = MOCK.mensal.reduce((s,m)=>s+m.vol_prev,0);
MOCK.skus_criticos = MOCK.cobertura.filter(c=>c.status==='critico').length;
MOCK.skus_atencao  = MOCK.cobertura.filter(c=>c.status==='atencao').length;
MOCK.cob_media = MOCK.cobertura.reduce((s,c)=>s+c.cob_sem,0)/MOCK.cobertura.length;
MOCK.fa_atual  = MOCK.fa_history.at(-1).wmape;
MOCK.bias_atual= MOCK.fa_history.at(-1).bias;

// ── Faturamento file parser ───────────────────────────────────
// Structure: row7=months, row8=headers, row9+=data
// cols: 0=família, 1=código, 2-3=Jan(R$,cx), 4-5=Fev, 6-7=Mar, 8-9=Total
function parseFaturamentoXLSX(rows) {
  // ── Estrutura Omie "Vendas Empresa por Produto" ──────────────────
  // R6:  "Data de Emissão.Mês"
  // R7:  NaN NaN NaN "Janeiro" NaN "Fevereiro" NaN "Março" NaN "Totais" NaN
  //       col:   0    1    2      3       4       5       6     7     8     9    10
  // R8:  Família | Código | Descrição | R$Jan | qtyJan | R$Fev | qtyFev | R$Mar | qtyMar | TotalR$ | TotalQty
  // R9+: data rows — col0=família (só na 1ª linha do grupo, depois NaN)
  //                  col1=código SKU
  //                  col2=descrição
  //                  col3..8 = dados mensais em pares (R$, qty)
  //                  col9=total R$, col10=total qty

  const MONTH_NAMES_PT = ['janeiro','fevereiro','marco','abril','maio','junho',
                          'julho','agosto','setembro','outubro','novembro','dezembro'];

  function normM(s) {
    return String(s||'').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }

  // 1. Detect month row and build monthCols map
  let monthRowIdx = -1;
  for (let i = 0; i < Math.min(12, rows.length); i++) {
    const r = rows[i] || [];
    if (r.some(c => MONTH_NAMES_PT.includes(normM(c)))) {
      monthRowIdx = i; break;
    }
  }
  if (monthRowIdx < 0) monthRowIdx = 7;

  const monthRow  = rows[monthRowIdx] || [];
  // Month columns: scan every cell in monthRow
  // Each month label is at colR; data is (colR, colR+1) = (R$, qty)
  const monthCols = [];
  for (let c = 0; c < monthRow.length; c++) {
    const v = monthRow[c];
    const vn = normM(v);
    if (MONTH_NAMES_PT.includes(vn)) {
      // Capitalize first letter to use as display name
      const nome = String(v||'').trim();
      monthCols.push({ nome, colR: c, colQ: c + 1 });
    }
  }

  // 2. Header row = monthRowIdx + 1 (has Família/Código/Descrição labels)
  const dataStartIdx = monthRowIdx + 2; // data starts 2 rows after month row

  // 3. Parse data rows with family carry-forward
  const skus = {};
  let familiaAtual = '';

  for (let r = dataStartIdx; r < rows.length; r++) {
    const row = rows[r] || [];

    // Skip completely empty rows
    if (row.every(c => c === '' || c === null || c === undefined)) continue;

    const col0 = row[0];  // Família (only on first SKU of group)
    const col1 = String(row[1] || '').trim();  // Código do Produto
    const col2 = String(row[2] || '').trim();  // Descrição do Produto

    // "Total geral" = last row, stop
    if (String(col0||'').toLowerCase().includes('total geral') ||
        String(col1||'').toLowerCase().includes('total geral')) break;

    // Update família when col0 is not null/empty (carry-forward)
    if (col0 !== null && col0 !== undefined && col0 !== '') {
      familiaAtual = String(col0).trim();
    }

    // Must have a valid SKU code in col1
    if (!col1 || !col1.match(/^[A-Za-z]{2}\d{2,}/)) continue;

    const cod = col1.toUpperCase();

    // Read monthly data using detected column positions
    const meses = {};
    monthCols.forEach(mc => {
      const rVal = parseFloat(String(row[mc.colR] === undefined || row[mc.colR] === null ? '0' : row[mc.colR]).replace(',','.')) || 0;
      const qVal = parseFloat(String(row[mc.colQ] === undefined || row[mc.colQ] === null ? '0' : row[mc.colQ]).replace(',','.')) || 0;
      meses[mc.nome] = { receita: rVal, qtd_cx: qVal };
    });

    // Total: last 2 populated columns (col9=R$, col10=qty for 3-month report)
    const totalR  = parseFloat(String(row[9]  === undefined || row[9]  === null ? '0' : row[9] ).replace(',','.')) || 0;
    const totalQty= parseFloat(String(row[10] === undefined || row[10] === null ? '0' : row[10]).replace(',','.')) || 0;

    skus[cod] = {
      codigo:    cod,
      descricao: col2,
      familia:   familiaAtual,
      meses,
      total_receita: totalR,
      total_cx:      totalQty,
    };
  }

  return {
    skus,
    meses: monthCols.map(m => m.nome),
    parsed_at: new Date().toISOString(),
  };
}


// Un/cx mapping (from skill file)
const CX_UN_MAP = {};
function getCxUn(sku, desc) {
  if (CX_UN_MAP[sku]) return CX_UN_MAP[sku];
  const d = (desc||'').toUpperCase();
  if (d.includes('CX 24')) return 24;
  if (d.includes('CX 48')) return 48;
  if (d.includes('CX 108')) return 108;
  if (d.includes('CX 128')) return 128;
  if (d.includes('CX 25')) return 25;
  if (d.includes('KIT 6')) return 6;
  return 72; // default
}

// ── Constants ─────────────────────────────────────────────────
const MESES        = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const SAZONALIDADE = (() => {
  try { const s=JSON.parse(localStorage.getItem('odara-saz-v2')); if(s&&s.length===13) return s; } catch(_){}
  return [0,.65,.66,.92,1.11,.97,1.07,1.21,1.12,1.22,1.09,1.16,.82];
})();
const DIAS_UTEIS   = (() => {
  try { const c=JSON.parse(localStorage.getItem('odara-cal-v2')); if(c&&c.length===13) return c; } catch(_){}
  return [0,21,18,22,20,21,21,23,22,21,22,21,17];
})();
const SKU_LINHA    = {
  L01:['PP01001','PP02001','PP05001','PP09001','PP10001','PP11001'],
  L02:['PP03001','PP03008','PP29001','PP30001'],
  L03:['PP26001','PP27001','PP18001','PP20001','PP19001','PP12001','PP15001','PP21001','PP22001','PP28001']
};
const DEM_SEMANAL  = {
  PP01001:69862,PP02001:43935,PP05001:10423,PP03001:18956,PP03008:1488,
  PP29001:6109,PP30001:6188,PP26001:9328,PP27001:9344,PP18001:4418,
  PP20001:3365,PP19001:2330
};
const TICKET       = {
  PP01001:3.41,PP02001:3.46,PP05001:4.86,PP03001:1.67,PP03008:3.40,
  PP29001:4.86,PP30001:4.86,PP26001:3.39,PP27001:3.39,PP18001:2.87,
  PP20001:2.82,PP19001:2.72
};
const DR_PEANUT    = [0,0,215000,260000,280000,220000,240000,180000,180000,180000,180000,180000,180000];

// ── Calculation helpers ───────────────────────────────────────
function getCapDia(linha) { return CAP_CONFIG[linha]?.dia || {L01:25920,L02:8640,L03:20000}[linha] || 0; }
function calcDemandaMensal(linha,mes){
  const skus=SKU_LINHA[linha]||[];
  let t=skus.reduce((s,sku)=>s+(DEM_SEMANAL[sku]||0)*SAZONALIDADE[mes]*4.333,0);
  if(linha==='L03') t+=DR_PEANUT[mes]||0;
  return Math.round(t);
}
function calcCapMensal(linha,mes,he=0){ return getCapDia(linha)*(DIAS_UTEIS[mes]+he); }
function calcOcupacao(linha,mes,he=0){
  const d=calcDemandaMensal(linha,mes),c=calcCapMensal(linha,mes,he);
  return c>0?d/c*100:0;
}

// ── Formatting ────────────────────────────────────────────────
function formatBRL(v){
  if(v>=1e6) return `R$ ${(v/1e6).toFixed(1)}M`;
  if(v>=1e3) return `R$ ${(v/1e3).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
}
function formatInt(v){ return new Intl.NumberFormat('pt-BR').format(Math.round(v||0)); }
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
function formatTs(iso){
  if(!iso) return '—';
  const d=new Date(iso);
  return d.toLocaleDateString('pt-BR')+' '+d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
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
function showToast(msg, type='ok', duration=3000){
  let t=document.getElementById('toast');
  if(!t){
    t=document.createElement('div'); t.id='toast';
    Object.assign(t.style,{
      position:'fixed',bottom:'20px',right:'20px',zIndex:'9999',
      padding:'10px 16px',borderRadius:'6px',fontFamily:'var(--font-mono)',
      fontSize:'.78rem',fontWeight:'600',maxWidth:'380px',
      opacity:'0',transition:'opacity .25s',
    });
    document.body.appendChild(t);
  }
  const styles={
    ok:'background:var(--verde-dim);color:var(--verde);border:1px solid rgba(34,197,94,.3)',
    error:'background:var(--vermelho-dim);color:#FF7B85;border:1px solid rgba(238,39,55,.3)',
    warn:'background:var(--amarelo-dim);color:var(--amarelo);border:1px solid rgba(255,184,29,.2)',
  };
  t.setAttribute('style',t.getAttribute('style')+';'+styles[type]);
  t.textContent=msg; t.style.opacity='1';
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.style.opacity='0', duration);
}

// ── Init ──────────────────────────────────────────────────────
function initApp(activeId){
  applyTheme(getTheme());
  initSupabase();
  setChartDefaults();
  renderNav(activeId, MOCK.skus_criticos + MOCK.skus_atencao);
}
