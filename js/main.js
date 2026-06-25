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
    if (w) w.style.display = apiKey ? 'none' : 'block';
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
      if (!apiKey) {
        document.getElementById('apiSetup').style.display = 'flex';
      } else {
        enterApp();
      }
    }, 600);
  }, 2400);
});

function enterApp() {
  document.getElementById('apiSetup').style.display = 'none';
  document.getElementById('app').classList.add('show');
  renderDashboard();
}

/* ===== APIキー ===== */
function saveApiKey() {
  const v = document.getElementById('apiKeySetupInp').value.trim();
  if (!v) { toast('APIキーを入力してください', 'error'); return; }
  apiKey = v;
  localStorage.setItem('folio_key', v);
  toast('APIキーを保存しました ✓', 'success');
  enterApp();
}
function skipApiKey() { apiKey = ''; enterApp(); }

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
  toast(v ? 'APIキーを保存しました ✓' : 'APIキーを削除しました', 'success');
}
function clearApiKey() {
  apiKey = '';
  localStorage.removeItem('folio_key');
  document.getElementById('apiKeyModalInp').value = '';
  updateApiDotModal();
}

/* ===== ファイルアップロード ===== */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('fileInput').addEventListener('change', e => {
    handleFiles(Array.from(e.target.files));
    e.target.value = '';
  });
});

function handleFiles(files) {
  files.forEach(f => {
    const r = new FileReader();
    r.onload = e => {
      pendingFiles.push({ file: f, dataUrl: e.target.result });
      renderThumbs();
      document.getElementById('analyzeBtn').disabled = false;
    };
    r.readAsDataURL(f);
  });
}
function renderThumbs() {
  const l = document.getElementById('thumbList');
  l.innerHTML = '';
  pendingFiles.forEach((p, i) => {
    const d = document.createElement('div');
    d.className = 'thumb';
    d.innerHTML = `<img src="${p.dataUrl}"><button class="thumb-x" onclick="removeThumb(${i})">×</button>`;
    l.appendChild(d);
  });
  document.getElementById('ucBadge').textContent = pendingFiles.length ? pendingFiles.length + '枚' : 'AI';
}
function removeThumb(i) {
  pendingFiles.splice(i, 1);
  renderThumbs();
  if (!pendingFiles.length) document.getElementById('analyzeBtn').disabled = true;
}

/* ===== 解析オーバーレイ ===== */
const AO_LINES = [
  '> Initializing Gemini Vision API...',
  '> Processing image data...',
  '> Running OCR pipeline...',
  '> Extracting portfolio values...',
  '> Parsing date metadata...',
  '> Categorizing assets...',
  '> Validating data...',
  '> Analysis complete ✓',
];
let aoTimer = null;

function showAoOverlay(total) {
  const el = document.getElementById('aoOverlay');
  el.style.display = 'flex';
  document.getElementById('aoBar').style.width = '0%';
  document.getElementById('aoLog').innerHTML = '';
  document.getElementById('aoCount').textContent = total + ' image' + (total > 1 ? 's' : '') + ' queued';
  let i = 0;
  aoTimer = setInterval(() => {
    if (i >= AO_LINES.length) { clearInterval(aoTimer); return; }
    const log = document.getElementById('aoLog');
    const d = document.createElement('div');
    d.style.cssText = 'opacity:0;transform:translateY(4px);transition:all .2s;';
    d.textContent = AO_LINES[i++];
    log.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => { d.style.opacity = '1'; d.style.transform = 'none'; }));
    log.scrollTop = log.scrollHeight;
  }, 300);
}
function addAoLog(text, color) {
  const log = document.getElementById('aoLog');
  const d = document.createElement('div');
  d.style.cssText = `color:${color || '#8b92a8'};opacity:0;transition:opacity .2s;`;
  d.textContent = text;
  log.appendChild(d);
  requestAnimationFrame(() => requestAnimationFrame(() => d.style.opacity = '1'));
  log.scrollTop = log.scrollHeight;
}
function hideAoOverlay(count) {
  clearInterval(aoTimer);
  document.getElementById('aoBar').style.width = '100%';
  setTimeout(() => {
    document.getElementById('aoOverlay').style.display = 'none';
    showSucOverlay(count);
  }, 500);
}
function showSucOverlay(count) {
  const el = document.getElementById('sucOverlay');
  el.style.display = 'flex';
  document.getElementById('soSub').textContent = count + ' MONTH' + (count > 1 ? 'S' : '') + ' RECORDED';
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .5s';
    setTimeout(() => { el.style.display = 'none'; el.style.opacity = '1'; el.style.transition = ''; }, 500);
  }, 1600);
}

/* ===== Gemini 解析フロー ===== */
async function startAnalysis() {
  if (!pendingFiles.length) return;
  if (!apiKey) { toast('APIキーを設定してください', 'error', 4000); navTo('settings'); return; }
  document.getElementById('analyzeBtn').disabled = true;
  const tot = pendingFiles.length;
  let done = 0;
  const results = [];
  showAoOverlay(tot);

  for (const pf of pendingFiles) {
    done++;
    document.getElementById('aoBar').style.width  = Math.round((done / tot) * 85 + 5) + '%';
    document.getElementById('aoSub').textContent  = `PROCESSING ${done}/${tot}...`;
    try {
      const res = await callGeminiVision(pf.dataUrl.split(',')[1], pf.file.type || 'image/jpeg');
      if (res.month) {
        addAoLog(`✓ ${res.month}: ${res.total ? res.total.toLocaleString() : '?'}円`, '#2dd4a0');
        results.push(res);
      } else {
        addAoLog('⚠ 日付読み取り失敗 - スキップ', '#f5a623');
      }
    } catch (e) {
      hideAoOverlay(0);
      toast('エラー: ' + e.message, 'error', 5000);
      document.getElementById('analyzeBtn').disabled = false;
      return;
    }
  }
  pendingFiles = [];
  renderThumbs();
  hideAoOverlay(results.length);
  if (!results.length) { toast('データを読み取れませんでした', 'error'); return; }
  setTimeout(() => openConfirmModal(results), 1800);
}

/* ===== 解析確認モーダル ===== */
function openConfirmModal(results) {
  confirmResults = results.map(r => JSON.parse(JSON.stringify(r)));
  const PAL = pal();
  document.getElementById('confirmList').innerHTML = confirmResults.map((r, ri) =>
    `<div class="conf-card">
       <div class="conf-tag">📅 ${r.month || '日付不明'}</div>
       <div class="conf-fld">
         <div class="conf-lbl">年月 (YYYY-MM)</div>
         <input class="conf-inp" type="month" value="${r.month || ''}" onchange="confirmResults[${ri}].month=this.value">
       </div>
       <div class="conf-fld">
         <div class="conf-lbl">総資産額（円）</div>
         <input class="conf-inp" type="number" value="${r.total || 0}" onchange="confirmResults[${ri}].total=parseFloat(this.value)||0">
       </div>
       <div class="conf-cats">
         ${categories.map(c =>
           `<div class="conf-cat-fld">
              <div class="conf-cat-lbl"><div class="c-dot" style="background:${PAL[c.name]||'#888'}"></div>${c.name}</div>
              <input class="conf-inp" type="number" value="${(r.categories||{})[c.name]||0}"
                onchange="confirmResults[${ri}].categories=confirmResults[${ri}].categories||{};confirmResults[${ri}].categories['${c.name}']=parseFloat(this.value)||0">
            </div>`
         ).join('')}
       </div>
     </div>`
  ).join('');
  document.getElementById('confirmModal').classList.remove('hide');
}

function confirmSave() {
  const valid = confirmResults.filter(r => r.month && r.total > 0);
  if (!valid.length) { toast('有効なデータがありません', 'error'); return; }
  valid.forEach(r => { allData = allData.filter(d => d.month !== r.month); allData.push(r); });
  allData.sort((a, b) => a.month.localeCompare(b.month));
  saveData();
  document.getElementById('confirmModal').classList.add('hide');
  toast(valid.length + '件を保存しました ✓', 'success');
  renderDashboard();
  setTimeout(() => navTo('dash'), 600);
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
