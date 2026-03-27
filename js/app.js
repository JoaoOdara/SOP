/* ══════════════════════════════════════════════════════════════
   ODARA S&OP — app.js  (shared across all pages)
   ══════════════════════════════════════════════════════════════ */

// ── Supabase client ──────────────────────────────────────────
let db = null;

function initSupabase() {
  try {
    db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.warn('Supabase não inicializado — usando dados locais:', e);
  }
}

// ── Chart.js defaults ────────────────────────────────────────
function setChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color            = '#888';
  Chart.defaults.borderColor      = '#262626';
  Chart.defaults.font.family      = "'JetBrains Mono', monospace";
  Chart.defaults.font.size        = 11;
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.padding  = 14;
  Chart.defaults.plugins.tooltip.backgroundColor = '#181818';
  Chart.defaults.plugins.tooltip.borderColor     = '#333';
  Chart.defaults.plugins.tooltip.borderWidth     = 1;
  Chart.defaults.plugins.tooltip.titleColor      = '#EFEFEF';
  Chart.defaults.plugins.tooltip.bodyColor       = '#999';
  Chart.defaults.plugins.tooltip.padding         = 10;
  Chart.defaults.plugins.tooltip.titleFont       = { family: "'Barlow Semi Condensed'", size: 12, weight: '700' };
  Chart.defaults.plugins.tooltip.bodyFont        = { family: "'JetBrains Mono'", size: 11 };
}

// ── Navigation ───────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'visao-geral',    href: 'index.html',         icon: '◈', label: 'Visão Geral'     },
  { id: 'planejamento',   href: 'planejamento.html',   icon: '▦', label: 'Planejamento'    },
  { id: 'headcount',      href: 'headcount.html',      icon: '◉', label: 'Headcount'       },
  { id: 'materiais',      href: 'materiais.html',      icon: '⬡', label: 'Materiais'       },
  { id: 'acuracidade',    href: 'acuracidade.html',    icon: '◎', label: 'Acuracidade'     },
];

function renderNav(activeId) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const semanaRef = getWeekRef();

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="brand">Odara</div>
      <div class="sub">S&amp;OP · 2026</div>
    </div>
    <nav class="sidebar-nav">
      ${NAV_ITEMS.map(item => `
        <a href="${item.href}" class="nav-item ${item.id === activeId ? 'active' : ''}">
          <span class="nav-icon">${item.icon}</span>
          ${item.label}
        </a>
      `).join('')}
    </nav>
    <div class="sidebar-meta">
      <div class="meta-row"><span>Semana ref.</span><span class="meta-val">${semanaRef}</span></div>
      <div class="meta-row"><span>Últ. upload</span><span class="meta-val" id="meta-upload">—</span></div>
      <div class="meta-row"><span>Projeto</span><span class="meta-val">khqbim…</span></div>
    </div>
  `;

  // Fetch last upload date
  fetchLastUpload();
}

async function fetchLastUpload() {
  if (!db) return;
  try {
    const { data } = await db
      .from('sop_uploads')
      .select('criado_em')
      .order('criado_em', { ascending: false })
      .limit(1)
      .single();
    if (data) {
      const el = document.getElementById('meta-upload');
      if (el) el.textContent = formatDate(data.criado_em);
    }
  } catch (_) {}
}

// ── Date helpers ─────────────────────────────────────────────
function getWeekRef() {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(today.setDate(diff));
  return `${String(mon.getDate()).padStart(2,'0')}/${String(mon.getMonth()+1).padStart(2,'0')}`;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function formatMes(m) {
  return ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][m] || '';
}

function formatBRL(val) {
  if (val >= 1_000_000) return `R$ ${(val/1_000_000).toFixed(1)}M`;
  if (val >= 1_000)     return `R$ ${(val/1_000).toFixed(0)}K`;
  return `R$ ${val.toFixed(0)}`;
}

function formatInt(val) {
  return new Intl.NumberFormat('pt-BR').format(Math.round(val));
}

// ── Dados de referência (fallback se Supabase offline) ────────

const DIAS_UTEIS_2026 = [0, 21, 18, 22, 20, 21, 21, 23, 22, 21, 22, 21, 17];
const MESES = ['','Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

const SAZONALIDADE = [0, 0.65, 0.66, 0.92, 1.11, 0.97, 1.07, 1.21, 1.12, 1.22, 1.09, 1.16, 0.82];

// Demanda semanal média por SKU (unidades)
const DEM_SEMANAL = {
  'PP01001': 69862,  // Clássico Trad
  'PP02001': 43935,  // Clássico Branco
  'PP05001': 10423,  // Clássico Dark
  'PP03001': 18956,  // Mini Trad
  'PP03008': 1488,   // Mini Duplo
  'PP29001': 6109,   // Zero Trad
  'PP30001': 6188,   // Zero Branco
  'PP26001': 9328,   // Crocante Prestígio
  'PP27001': 9344,   // Crocante Galak
  'PP18001': 4418,   // Crocante Avela
  'PP20001': 3365,   // Crocante Milk
  'PP19001': 2330,   // Crocante Paçoca
};

const TICKET = {
  'PP01001': 3.41, 'PP02001': 3.46, 'PP05001': 4.86,
  'PP03001': 1.67, 'PP03008': 3.40,
  'PP29001': 4.86, 'PP30001': 4.86,
  'PP26001': 3.39, 'PP27001': 3.39,
  'PP18001': 2.87, 'PP20001': 2.82, 'PP19001': 2.72,
};

const SKU_LINHA = {
  L01: ['PP01001','PP02001','PP05001'],
  L02: ['PP03001','PP03008','PP29001','PP30001'],
  L03: ['PP26001','PP27001','PP18001','PP20001','PP19001'],
};

const CAP_DIA = { L01: 25920, L02: 8640, L03: 20000 };

// Dr Peanut volumes mensais 2026 (unidades)
const DR_PEANUT_2026 = [0, 0, 215000, 260000, 280000, 220000, 240000, 180000, 180000, 180000, 180000, 180000, 180000];

// ── Cálculo de demanda mensal por linha ──────────────────────
function calcDemandaMensal(linha, mes) {
  const skus = SKU_LINHA[linha] || [];
  const idx  = SAZONALIDADE[mes];
  let total  = skus.reduce((s, sku) => {
    const sem = DEM_SEMANAL[sku] || 0;
    return s + sem * idx * 4.333;
  }, 0);
  if (linha === 'L03') total += DR_PEANUT_2026[mes] || 0;
  return Math.round(total);
}

function calcCapacidadeMensal(linha, mes, heSab = 0) {
  const dias = DIAS_UTEIS_2026[mes] + heSab;
  return CAP_DIA[linha] * dias;
}

function calcReceitaMensal(mes) {
  let total = 0;
  ['L01','L02','L03'].forEach(linha => {
    const skus = SKU_LINHA[linha] || [];
    skus.forEach(sku => {
      const dem = (DEM_SEMANAL[sku] || 0) * SAZONALIDADE[mes] * 4.333;
      total += dem * (TICKET[sku] || 0);
    });
  });
  // Dr Peanut
  total += (DR_PEANUT_2026[mes] || 0) * 2.85;
  return total;
}

// ── Ocupação % ───────────────────────────────────────────────
function calcOcupacao(linha, mes, heSab = 0) {
  const dem = calcDemandaMensal(linha, mes);
  const cap = calcCapacidadeMensal(linha, mes, heSab);
  return cap > 0 ? (dem / cap * 100) : 0;
}

// ── Fetch Supabase com fallback ──────────────────────────────
async function fetchMetas() {
  if (!db) return null;
  try {
    const { data, error } = await db
      .from('sop_metas_mensais')
      .select('mes, sku_codigo, demanda_meta, demanda_real, receita_meta')
      .eq('ano', 2026)
      .order('mes');
    if (error) throw error;
    return data;
  } catch(e) {
    console.warn('fetchMetas fallback:', e);
    return null;
  }
}

async function fetchEstoqueAtual() {
  if (!db) return null;
  try {
    // Get most recent week
    const { data: weeks } = await db
      .from('sop_estoque_semanal')
      .select('semana_ref')
      .order('semana_ref', { ascending: false })
      .limit(1)
      .single();
    if (!weeks) return null;

    const { data } = await db
      .from('sop_estoque_semanal')
      .select('*, sop_skus(descricao, familia, linha)')
      .eq('semana_ref', weeks.semana_ref)
      .order('status');
    return data;
  } catch(e) {
    return null;
  }
}

async function fetchAlertas() {
  if (!db) return [];
  try {
    const { data } = await db
      .from('sop_alertas')
      .select('*')
      .eq('resolvido', false)
      .order('criado_em', { ascending: false })
      .limit(10);
    return data || [];
  } catch(_) { return []; }
}

async function fetchVendasAcumuladas() {
  if (!db) return null;
  try {
    const { data } = await db
      .from('sop_vendas_semanais')
      .select('semana_ref, sku_codigo, qtd_vendida, receita_bruta');
    return data || [];
  } catch(_) { return null; }
}

// ── Inicialização global ─────────────────────────────────────
function initApp(activeNav) {
  initSupabase();
  setChartDefaults();
  renderNav(activeNav);
}
