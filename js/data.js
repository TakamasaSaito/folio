/* ===== グローバル状態 ===== */
let allData = [];
let charts = {};
let manualEditIdx = null;
let activePeriod = 0;
let colorPickIdx = -1;
let sparkChart = null;

const DEF_CATS = [
  { name: '株式',     color: '#c9a84c' },
  { name: '投資信託', color: '#4fa3e8' },
  { name: '現金・預金', color: '#2dd4a0' },
  { name: 'その他',   color: '#f5a623' },
];
const PALETTE = [
  '#c9a84c','#4fa3e8','#2dd4a0','#f05c6e','#f5a623','#a78bfa',
  '#fb923c','#34d399','#e879f9','#38bdf8','#facc15','#f472b6',
];

let categories = [...DEF_CATS];
let goal = { amount: 0, date: '' };

/* ===== ユーティリティ ===== */
const fmt = n => {
  if (!n && n !== 0) return '-';
  if (n >= 100000000) return (n / 100000000).toFixed(1) + '億円';
  if (n >= 10000) return Math.round(n / 10000) + '万円';
  return n.toLocaleString() + '円';
};
const fmtS = n => {
  if (!n && n !== 0) return '-';
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '億';
  return Math.round(n / 10000) + '万';
};
const pal = () => {
  const p = {};
  categories.forEach(c => p[c.name] = c.color);
  return p;
};
const fd = () => (!activePeriod || allData.length <= activePeriod)
  ? allData
  : allData.slice(-activePeriod);

const gc = () => ({ grid: 'rgba(201,168,76,.08)', tick: '#3e4560' });

function countup(el, final) {
  const m = final.match(/([\d,.]+)/);
  if (!m) { el.textContent = final; return; }
  const num = parseFloat(m[1].replace(/,/g, ''));
  const pre = final.slice(0, final.indexOf(m[1]));
  const suf = final.slice(final.indexOf(m[1]) + m[1].length);
  let s = null;
  const dur = 600;
  (function step(ts) {
    if (!s) s = ts;
    const p = Math.min((ts - s) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    const v = num * e;
    el.textContent = pre + (v >= 10000 ? Math.round(v / 10000) : Math.round(v)).toLocaleString() + suf;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = final;
  })(performance.now());
}

/* ===== localStorage CRUD ===== */
function loadAll() {
  try { const d = localStorage.getItem('folio_data'); if (d) allData = JSON.parse(d); } catch (e) {}
  try { const c = localStorage.getItem('folio_cats'); if (c) categories = JSON.parse(c); } catch (e) {}
  try {
    const g = localStorage.getItem('folio_goal');
    if (g) {
      goal = JSON.parse(g);
      const ga = document.getElementById('goalAmount');
      const gd = document.getElementById('goalDate');
      if (ga && goal.amount) ga.value = goal.amount;
      if (gd && goal.date)   gd.value = goal.date;
    }
  } catch (e) {}
}

function saveData() {
  try { localStorage.setItem('folio_data', JSON.stringify(allData)); } catch (e) {}
}

function saveSettings() {
  try { localStorage.setItem('folio_cats', JSON.stringify(categories)); } catch (e) {}
}

function saveGoal() {
  goal.amount = parseFloat(document.getElementById('goalAmount').value) || 0;
  goal.date   = document.getElementById('goalDate').value || '';
  try { localStorage.setItem('folio_goal', JSON.stringify(goal)); } catch (e) {}
  renderHomeSummary();
}
