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

/* APIキーステータス */
function updateApiStatus() {
  const has = !!apiKey;
  const dot = document.getElementById('apiDotStg');
  if (dot) dot.className = 'api-dot ' + (has ? 'ok' : 'ng');
  const stg = document.getElementById('apiStatusStg');
  if (stg) stg.textContent = has
    ? 'APIキー設定済み ✓ - AI機能が使えます'
    : '未設定 - AIレポート・スクショ解析が使えません';
  const sub = document.getElementById('apiKeyStgSub');
  if (sub) sub.textContent = has ? '設定済み ✓' : '未設定';
}

function updateApiDotModal() {
  const has = !!apiKey;
  const dot = document.getElementById('apiDotModal');
  if (dot) dot.className = 'api-dot ' + (has ? 'ok' : 'ng');
  const txt = document.getElementById('apiDotModalTxt');
  if (txt) txt.textContent = has ? 'APIキー設定済み ✓' : '未設定';
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

/* AIレポート生成 */
async function generateReport() {
  if (!allData.length) { toast('データがありません', 'error'); return; }
  if (!apiKey) { toast('APIキーを設定してください', 'error'); navTo('settings'); return; }

  const btn  = document.getElementById('reportBtn');
  const body = document.getElementById('reportBody');
  btn.disabled = true;
  btn.textContent = '✦ 生成中...';
  body.className = 'rpt-txt';
  body.innerHTML = '<div class="dot-loader"><span></span><span></span><span></span></div>';

  const lat    = allData[allData.length - 1];
  const first  = allData[0];
  const n      = allData.length;
  const rets   = [];
  for (let i = 1; i < n; i++)
    rets.push(((allData[i].total - allData[i - 1].total) / allData[i - 1].total * 100).toFixed(2));
  const avgRet = rets.length ? (rets.reduce((a, b) => a + parseFloat(b), 0) / rets.length).toFixed(2) : 0;

  const prompt =
    'あなたは資産管理の専門アドバイザーです。以下のデータを分析し、日本語でJSONのみを回答してください（マークダウン・説明文不可）:\n' +
    '{"summary":"2〜3文の総括","insights":[{"icon":"📈","title":"強み","text":"具体的内容"},{"icon":"⚠️","title":"注意点","text":"具体的内容"},{"icon":"💡","title":"アドバイス","text":"具体的内容"},{"icon":"🎯","title":"次のアクション","text":"具体的内容"}],"outlook":"今後の見通し1〜2文"}\n\n' +
    `データ: 期間${first.month}〜${lat.month}(${n}ヶ月), 総資産¥${lat.total.toLocaleString()}, 月平均${avgRet}%, カテゴリ${JSON.stringify(lat.categories || {})}`;

  try {
    const text   = await callGeminiText(prompt);
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
    let html = '';
    if (parsed.summary)
      html += `<div class="rpt-sec"><div class="rpt-sec-ttl">📋 サマリー</div><div style="font-size:13px;color:var(--txt2);line-height:1.75;">${parsed.summary}</div></div>`;
    if (parsed.insights && parsed.insights.length) {
      html += '<div class="rpt-sec"><div class="rpt-sec-ttl">💡 インサイト</div>';
      parsed.insights.forEach(ins => {
        html += `<div class="rpt-row"><div class="rpt-row-ico">${ins.icon || '•'}</div><div class="rpt-row-txt"><strong>${ins.title}</strong><br>${ins.text}</div></div>`;
      });
      html += '</div>';
    }
    if (parsed.outlook)
      html += `<div class="rpt-sec"><div class="rpt-sec-ttl">🔭 今後の見通し</div><div style="font-size:13px;color:var(--txt2);line-height:1.75;">${parsed.outlook}</div></div>`;
    body.innerHTML = html;
  } catch (e) {
    body.innerHTML = `<div style="color:var(--ruby);font-size:13px;">エラー: ${e.message}</div>`;
  }
  btn.disabled = false;
  btn.textContent = '✦ 再生成する';
}

async function generateAlloc() {
  if (!allData.length) { toast('データがありません', 'error'); return; }
  if (!apiKey) { toast('APIキーを設定してください', 'error'); navTo('settings'); return; }

  const btn  = document.getElementById('allocBtn');
  const body = document.getElementById('allocBody');
  btn.disabled = true;
  btn.textContent = '✦ 診断中...';
  body.className = 'rpt-txt';
  body.innerHTML = '<div class="dot-loader"><span></span><span></span><span></span></div>';

  const age     = document.getElementById('allocAge').value || 35;
  const risk    = document.getElementById('allocRisk').value;
  const purpose = { retire: '老後資金', house: '住宅購入', edu: '教育資金', wealth: '資産拡大' }[document.getElementById('allocPurpose').value];
  const riskLabel = risk === 'low' ? '低（安定重視）' : risk === 'mid' ? '中（バランス）' : '高（成長重視）';
  const lat = allData[allData.length - 1];

  const prompt =
    `FPとして、${age}歳・リスク許容度${riskLabel}・目的${purpose}の方に最適な資産配分アドバイスを日本語で作成してください。` +
    `現在の資産: ${JSON.stringify(lat.categories || {})} 総資産¥${lat.total.toLocaleString()}。\n` +
    '【現状評価】【推奨配分（具体的な%で）】【改善ステップ】【注意点】の構成で。';

  try {
    const text = await callGeminiText(prompt);
    body.textContent = text;
  } catch (e) {
    body.innerHTML = `<div style="color:var(--ruby);">エラー: ${e.message}</div>`;
  }
  btn.disabled = false;
  btn.textContent = '✦ 再診断する';
}
