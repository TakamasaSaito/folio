/* ===== トースト通知 ===== */
function toast(msg, type = 'info', dur = 3000) {
  const c = document.getElementById('tc');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  const ico = type === 'success' ? '✓' : type === 'error' ? '✕' : '';
  t.innerHTML = type === 'loading'
    ? `<div class="spin"></div><div>${msg}</div>`
    : `<div class="t-ico">${ico}</div><div>${msg}</div>`;
  c.appendChild(t);
  if (dur > 0) setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 280); }, dur);
  return t;
}
function rmToast(t) {
  if (t && t.parentNode) { t.classList.add('out'); setTimeout(() => t.remove(), 280); }
}

/* ===== 画面遷移 ===== */
const SCREENS = ['home', 'dash', 'risk', 'sim', 'report', 'settings'];
function navTo(n) {
  SCREENS.forEach(s => {
    document.getElementById('sc-' + s)?.classList.toggle('active', s === n);
    document.getElementById('ni-' + s)?.classList.toggle('active', n !== 'settings' && s === n);
    document.getElementById('sni-' + s)?.classList.toggle('active', s === n);
  });
  if (n === 'risk')     renderRisk();
  if (n === 'sim')      runSim();
  if (n === 'settings') { renderCatList(); updateApiStatus(); }
  if (n === 'report') {
    const w = document.getElementById('rptApiWarn');
    if (w) w.style.display = apiKey ? 'none' : 'flex';
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ===== 起動 ===== */
window.addEventListener('load', () => {
  loadAll();
  const clockEl = document.getElementById('clock');
  const tickClock = () => { if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('ja-JP'); };
  tickClock();
  setInterval(tickClock, 1000);

  setTimeout(() => {
    const s = document.getElementById('splash');
    s.classList.add('out');
    setTimeout(() => {
      s.style.display = 'none';
      enterApp();
    }, 600);
  }, 2400);
});

function enterApp() {
  document.getElementById('app').classList.add('show');
  renderDashboard();
}

/* ===== APIキー (AIレポート用・任意) ===== */
function openApiKeyModal() {
  document.getElementById('apiKeyModalInp').value = apiKey || '';
  updateApiDotModal();
  document.getElementById('apiKeyModal').classList.remove('hide');
}
function saveApiKeyModal() {
  const v = document.getElementById('apiKeyModalInp').value.trim();
  apiKey = v;
  if (v) localStorage.setItem('folio_key', v);
  else   localStorage.removeItem('folio_key');
  document.getElementById('apiKeyModal').classList.add('hide');
  updateApiStatus();
  const w = document.getElementById('rptApiWarn');
  if (w) w.style.display = v ? 'none' : 'flex';
  toast(v ? 'APIキーを保存しました ✓' : 'APIキーを削除しました', 'success');
}
function clearApiKey() {
  apiKey = '';
  localStorage.removeItem('folio_key');
  document.getElementById('apiKeyModalInp').value = '';
  updateApiDotModal();
}

/* ===== JSON インポート ===== */
document.addEventListener('DOMContentLoaded', () => {
  const zone = document.getElementById('importZone');
  if (!zone) return;
  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.classList.add('drag-over');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleJsonImport(file);
    else toast('ファイルを選択してください', 'error');
  });
});

function handleJsonImport(file) {
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const raw = JSON.parse(e.target.result);
      const importArr = Array.isArray(raw)
        ? raw
        : (raw.allData && Array.isArray(raw.allData) ? raw.allData : null);
      if (!importArr) throw new Error('allDataまたは配列形式のJSONが必要です');

      if (!Array.isArray(raw)) {
        if (raw.categories && raw.categories.length) categories = raw.categories;
        if (raw.goal) {
          goal = raw.goal;
          try { localStorage.setItem('folio_goal', JSON.stringify(goal)); } catch (_) {}
        }
      }
      let added = 0;
      importArr.forEach(d => {
        if (d.month && d.total > 0) {
          if (!d.categories) d.categories = {};
          allData = allData.filter(x => x.month !== d.month);
          allData.push(d);
          added++;
        }
      });
      allData.sort((a, b) => a.month.localeCompare(b.month));
      saveData();
      saveSettings();
      renderDashboard();
      toast(added + '件追加しました ✓', 'success');
      setTimeout(() => navTo('dash'), 500);
    } catch (err) {
      toast('エラー: ' + err.message, 'error');
    }
  };
  r.readAsText(file);
}

/* ===== プロンプトコピー ===== */
function copyPrompt() {
  const text = document.getElementById('promptText').textContent;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text.trim())
      .then(() => toast('プロンプトをコピーしました ✓', 'success'))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text.trim();
  ta.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  toast('プロンプトをコピーしました ✓', 'success');
}

/* ===== 手動入力モーダル ===== */
function openManualModal(idx) {
  manualEditIdx = idx;
  const isEdit = idx !== null;
  document.getElementById('manualTitle').textContent   = isEdit ? 'データを編集' : '手動入力';
  document.getElementById('manualSaveBtn').textContent = isEdit ? '✓ 更新する'  : '✓ 追加する';
  const d = isEdit ? allData[idx] : null;
  document.getElementById('manualMonth').value = d ? d.month    : '';
  document.getElementById('manualTotal').value = d ? d.total    : '';
  document.getElementById('manualNote').value  = d ? d.note||'' : '';
  const PAL = pal();
  document.getElementById('manualCats').innerHTML =
    '<div class="sim-lbl" style="margin-bottom:7px;">カテゴリ別内訳（円）</div>' +
    categories.map(c =>
      `<div class="conf-cat-fld" style="margin-bottom:8px;">
         <div class="conf-cat-lbl"><div class="c-dot" style="background:${PAL[c.name]||'#888'}"></div>${c.name}</div>
         <input class="conf-inp" type="number" id="mc_${c.name.replace(/[^\w]/g,'_')}" value="${d?(d.categories||{})[c.name]||0:0}">
       </div>`
    ).join('');
  document.getElementById('manualModal').classList.remove('hide');
}

function saveManual() {
  const month = document.getElementById('manualMonth').value;
  const total = parseFloat(document.getElementById('manualTotal').value) || 0;
  if (!month) { toast('年月を入力してください', 'error'); return; }
  if (!total) { toast('総資産額を入力してください', 'error'); return; }
  const cats = {};
  categories.forEach(c => {
    const el = document.getElementById('mc_' + c.name.replace(/[^\w]/g, '_'));
    cats[c.name] = el ? parseFloat(el.value) || 0 : 0;
  });
  const entry = { month, total, categories: cats, note: document.getElementById('manualNote').value, manual: true };
  if (manualEditIdx !== null) {
    allData[manualEditIdx] = entry;
  } else {
    allData = allData.filter(d => d.month !== month);
    allData.push(entry);
    allData.sort((a, b) => a.month.localeCompare(b.month));
  }
  saveData();
  document.getElementById('manualModal').classList.add('hide');
  toast(manualEditIdx !== null ? '更新しました ✓' : '追加しました ✓', 'success');
  renderDashboard();
  if (allData.length > 1) setTimeout(() => navTo('dash'), 500);
}

/* ===== サンプルデータ ===== */
function loadSample() {
  allData = [
    { month: '2024-01', total: 3200000, categories: { 株式: 1500000, 投資信託: 900000, '現金・預金': 700000, その他: 100000 } },
    { month: '2024-02', total: 3350000, categories: { 株式: 1620000, 投資信託: 950000, '現金・預金': 680000, その他: 100000 } },
    { month: '2024-03', total: 3180000, categories: { 株式: 1450000, 投資信託: 930000, '現金・預金': 700000, その他: 100000 } },
    { month: '2024-04', total: 3420000, categories: { 株式: 1680000, 投資信託: 980000, '現金・預金': 660000, その他: 100000 } },
    { month: '2024-05', total: 3600000, categories: { 株式: 1800000, 投資信託: 1020000, '現金・預金': 680000, その他: 100000 } },
    { month: '2024-06', total: 3520000, categories: { 株式: 1720000, 投資信託: 1010000, '現金・預金': 690000, その他: 100000 } },
  ];
  saveData();
  renderDashboard();
  toast('サンプルデータを読み込みました', 'success');
  setTimeout(() => navTo('dash'), 500);
}
