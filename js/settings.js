/* ===== 設定画面 ===== */

/* カテゴリリスト描画 */
function renderCatList() {
  document.getElementById('catListEl').innerHTML =
    '<div class="cat-list-wrap">' +
    categories.map((c, i) =>
      `<div class="cat-item">
         <div class="cat-dot" style="background:${c.color}" onclick="openColorPick(${i})"></div>
         <input class="cat-inp" value="${c.name}" onchange="categories[${i}].name=this.value;saveSettings();">
         <button class="cat-del" onclick="deleteCat(${i})">×</button>
       </div>`
    ).join('') +
    '</div>';
}

function addCat() {
  const used  = categories.map(c => c.color);
  const color = PALETTE.find(p => !used.includes(p)) || PALETTE[categories.length % PALETTE.length];
  categories.push({ name: '新しいカテゴリ', color });
  saveSettings();
  renderCatList();
}

function deleteCat(i) {
  if (categories.length <= 1) { toast('最低1つ必要です', 'error'); return; }
  categories.splice(i, 1);
  saveSettings();
  renderCatList();
}

/* カラーピッカー */
function openColorPick(i) {
  colorPickIdx = i;
  document.getElementById('colorGrid').innerHTML = PALETTE.map(c =>
    `<div class="color-sw${c === categories[i].color ? ' sel' : ''}" style="background:${c}" onclick="selectColor('${c}',this)"></div>`
  ).join('');
  document.getElementById('colorModal').classList.remove('hide');
}

function selectColor(c, el) {
  categories[colorPickIdx].color = c;
  document.querySelectorAll('.color-sw').forEach(s => s.classList.remove('sel'));
  el.classList.add('sel');
}

function closeColorPick() {
  document.getElementById('colorModal').classList.add('hide');
  saveSettings();
  renderCatList();
  if (allData.length) renderDashboard();
}

/* データエクスポート・インポート */
function exportJSON() {
  if (!allData.length) { toast('データがありません', 'error'); return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(
    [JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), categories, goal, allData }, null, 2)],
    { type: 'application/json' }
  ));
  a.download = 'folio_backup_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  toast('バックアップを保存しました ✓', 'success');
}

function importJSON(input) {
  const file = input.files[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = e => {
    try {
      const raw = JSON.parse(e.target.result);
      const importArr = Array.isArray(raw)
        ? raw
        : (raw.allData && Array.isArray(raw.allData) ? raw.allData : null);
      if (!importArr) throw new Error('allDataまたは配列形式のJSONが必要です');
      if (!confirm(`${importArr.length}件をインポートします`)) return;

      if (!Array.isArray(raw)) {
        if (raw.categories && raw.categories.length) categories = raw.categories;
        if (raw.goal) goal = raw.goal;
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
    input.value = '';
  };
  r.readAsText(file);
}

function exportCSV() {
  if (!allData.length) { toast('データがありません', 'error'); return; }
  const keys = categories.map(c => c.name);
  const rows = [['月', '総資産', ...keys, '前月比(円)', '前月比(%)', '備考']];
  allData.forEach((d, i) => {
    const prev = i > 0 ? allData[i - 1] : null;
    const diff = prev ? d.total - prev.total : null;
    const dp   = diff !== null ? ((diff / prev.total) * 100).toFixed(2) : null;
    rows.push([
      d.month, d.total,
      ...keys.map(k => (d.categories || {})[k] || 0),
      diff != null ? diff : '',
      dp != null ? dp : '',
      d.note || '',
    ]);
  });
  const csv = '﻿' + rows.map(r =>
    r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')
  ).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'folio_' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  toast('CSVをエクスポートしました ✓', 'success');
}

function clearAll() {
  if (!confirm('全データをリセットしますか？')) return;
  allData = [];
  Object.values(charts).forEach(c => { if (c) c.destroy(); });
  charts = {};
  if (sparkChart) { sparkChart.destroy(); sparkChart = null; }
  localStorage.removeItem('folio_data');
  document.getElementById('emptyState').style.display  = 'block';
  document.getElementById('homeSummary').style.display = 'none';
  document.getElementById('quickNav').style.display    = 'none';
  navTo('home');
  toast('データをリセットしました', 'success');
}

