/* ===== ダッシュボード・ホーム描画 ===== */

function renderDashboard() {
  simInitialized = false;
  document.getElementById('emptyState').style.display = allData.length ? 'none' : 'block';
  document.getElementById('quickNav').style.display   = allData.length ? 'block' : 'none';
  renderHomeSummary();
  if (!allData.length) return;
  renderKPIs();
  renderLineChart();
  renderDonutChart();
  renderBarChart();
  renderCategoryHighlights();
  renderTable();
  renderInsights();
  const el = document.getElementById('tbTotal');
  el.style.display = 'block';
  el.textContent = fmtS(allData[allData.length - 1].total);
}

/* ホームサマリー（ヒーローカード・スパークライン・メトリクス） */
function renderHomeSummary() {
  const wrap = document.getElementById('homeSummary');
  if (!wrap) return;
  if (!allData.length) { wrap.style.display = 'none'; return; }
  wrap.style.display = 'block';

  const lat   = allData[allData.length - 1];
  const prev  = allData.length > 1 ? allData[allData.length - 2] : null;
  const first = allData[0];
  const diff  = prev ? lat.total - prev.total : null;
  const diffP = diff !== null ? ((diff / prev.total) * 100).toFixed(1) : null;
  const totP  = ((lat.total - first.total) / first.total * 100).toFixed(1);

  document.getElementById('heroDate').textContent = lat.month;
  countup(document.getElementById('heroTotal'), fmt(lat.total));

  const de = document.getElementById('heroDiff');
  if (diff !== null) {
    de.textContent = (diff >= 0 ? '+' : '') + fmtS(diff) + ' (' + diffP + '%)';
    de.className   = 'h-diff ' + (diff >= 0 ? 'up' : 'dn');
  } else {
    de.textContent = '初月データ';
    de.className   = 'h-diff neu';
  }

  if (allData.length > 1) renderSparkline('homeSparkline');

  /* 目標進捗 */
  const gw = document.getElementById('heroGoal');
  if (goal.amount > 0) {
    gw.style.display = 'block';
    const goalYen = goal.amount * 10000;
    const pct    = Math.min(100, (lat.total / goalYen * 100)).toFixed(1);
    const remain = goalYen - lat.total;
    document.getElementById('hgAmt').textContent    = goal.amount.toLocaleString() + '万円';
    document.getElementById('hgPct').textContent    = pct + '%';
    document.getElementById('hgFill').style.width   = pct + '%';
    document.getElementById('hgRemain').textContent = remain > 0
      ? 'あと ' + fmt(remain) + ' で達成'
      : '🎉 目標達成！';
  } else {
    gw.style.display = 'none';
  }

  /* メトリクスストリップ */
  const mp = (l, v, s, oc) =>
    `<div class="mp" onclick="navTo('dash')">
       <div class="mp-lbl">${l}</div>
       <div class="mp-val" style="${oc ? 'color:' + oc : ''}">${v || '-'}</div>
       <div class="mp-sub">${s || ''}</div>
     </div>`;
  document.getElementById('metricStrip').innerHTML =
    mp('前月比',
       diff !== null ? (diff >= 0 ? '+' : '') + fmtS(diff) : '-',
       diff !== null ? Math.abs(diffP) + '%' : '初月',
       diff !== null ? (diff >= 0 ? 'var(--em)' : 'var(--ruby)') : null) +
    mp('累積',
       (totP >= 0 ? '+' : '') + totP + '%',
       first.month.slice(0, 7),
       totP >= 0 ? 'var(--em)' : 'var(--ruby)') +
    mp('記録', allData.length, 'ヶ月', null) +
    mp('最新', fmtS(lat.total), lat.month, null);
}

/* KPIストリップ */
function renderKPIs() {
  const lat   = allData[allData.length - 1];
  const prev  = allData.length > 1 ? allData[allData.length - 2] : null;
  const first = allData[0];
  const diff  = prev ? lat.total - prev.total : 0;
  const diffP = prev ? ((diff / prev.total) * 100).toFixed(1) : null;
  const totG  = lat.total - first.total;
  const totP  = ((totG / first.total) * 100).toFixed(1);

  const kpis = [
    { eye: 'Total Assets',   num: fmt(lat.total), delta: diffP ? (diff >= 0 ? '▲ ' : '▼ ') + Math.abs(diffP) + '%' : '初月データ', up: diff >= 0 },
    { eye: 'Monthly Change', num: prev ? (diff >= 0 ? '+' : '') + fmtS(diff) : '-', delta: diffP ? Math.abs(diffP) + '%' : '-', up: diff >= 0 },
    { eye: 'Total Return',   num: (totG >= 0 ? '+' : '') + fmtS(totG), delta: totP + '%', up: totG >= 0 },
    { eye: 'Months',         num: allData.length + 'ヶ月', delta: first.month + '〜' + lat.month, up: null },
  ];
  document.getElementById('kpiStrip').innerHTML = kpis.map(k =>
    `<div class="kpi">
       <div class="kpi-eye">${k.eye}</div>
       <div class="kpi-num">${k.num}</div>
       <div class="kpi-delta ${k.up === null ? 'neu' : k.up ? 'up' : 'dn'}">${k.delta}</div>
     </div>`
  ).join('');
}


/* カテゴリ別推移のサマリー */
function renderCategoryHighlights() {
  const totalEl = document.getElementById('catTrendTotal');
  const highlightEl = document.getElementById('catTrendHighlights');
  if (!totalEl || !highlightEl || !allData.length) return;

  const d = fd();
  const lat = d[d.length - 1];
  const prev = d.length > 1 ? d[d.length - 2] : null;
  const diff = prev ? lat.total - prev.total : 0;
  const diffPct = prev ? diff / prev.total * 100 : 0;
  const PAL = pal();

  totalEl.innerHTML = `
    <span class="ctt-label">Latest</span>
    <strong>${fmt(lat.total)}</strong>
    <span class="ctt-diff ${diff >= 0 ? 'up' : 'dn'}">${prev ? `${diff >= 0 ? '+' : ''}${diffPct.toFixed(1)}%` : '初月'}</span>
  `;

  const cats = categories
    .map(c => ({
      name: c.name,
      color: PAL[c.name] || c.color || '#888',
      value: (lat.categories || {})[c.name] || 0,
    }))
    .filter(c => c.value > 0)
    .sort((a, b) => b.value - a.value);

  highlightEl.innerHTML = cats.map(c => {
    const pct = lat.total ? c.value / lat.total * 100 : 0;
    return `<div class="ct-chip" style="--chip:${c.color};">
      <div class="ct-chip-top"><span>${c.name}</span><strong>${pct.toFixed(1)}%</strong></div>
      <div class="ct-chip-val">${fmt(c.value)}</div>
      <div class="ct-chip-bar"><i style="width:${Math.max(2, pct)}%"></i></div>
    </div>`;
  }).join('');
}

/* 期間フィルター */
function setPeriod(n) {
  activePeriod = n;
  document.querySelectorAll('.pc').forEach(c =>
    c.classList.toggle('active', n === 0 ? c.textContent === 'ALL' : parseInt(c.textContent) === n)
  );
  renderLineChart();
  renderBarChart();
  renderCategoryHighlights();
  renderInsights();
}

/* 月次データテーブル */
function renderTable() {
  document.querySelector('#dataTable thead').innerHTML =
    '<tr><th>月</th><th>総資産</th><th>前月比</th><th></th></tr>';
  document.querySelector('#dataTable tbody').innerHTML = allData.map((d, i) => {
    const prev = i > 0 ? allData[i - 1] : null;
    const diff = prev ? d.total - prev.total : null;
    const dp   = diff !== null ? ((diff / prev.total) * 100).toFixed(1) : null;
    return `<tr onclick="showMonthDetail(allData[${i}])">
      <td class="td-hi">${d.month}</td>
      <td class="td-hi">${fmt(d.total)}</td>
      <td>${diff !== null ? `<span class="${diff >= 0 ? 'td-up' : 'td-dn'}">${diff >= 0 ? '+' : ''}${dp}%</span>` : '-'}</td>
      <td style="display:flex;gap:4px;padding:8px 6px;">
        <button class="td-btn" onclick="event.stopPropagation();openManualModal(${i})">編集</button>
        <button class="td-del" onclick="event.stopPropagation();deleteEntry(${i})">削除</button>
      </td>
    </tr>`;
  }).join('');
}

/* インサイト */
function renderInsights() {
  const d = fd();
  if (d.length < 2) {
    document.getElementById('insightGrid').innerHTML =
      '<div style="color:var(--txt3);font-size:12px;">2ヶ月以上のデータで表示されます</div>';
    return;
  }
  const lat   = d[d.length - 1];
  const first = d[0];
  const rets  = [];
  for (let i = 1; i < d.length; i++)
    rets.push((d[i].total - d[i - 1].total) / d[i - 1].total * 100);

  const avg  = rets.reduce((a, b) => a + b, 0) / rets.length;
  const max  = Math.max(...rets);
  const min  = Math.min(...rets);
  const totP = ((lat.total - first.total) / first.total * 100).toFixed(1);
  const cats = lat.categories || {};
  const catKeys = categories.map(c => c.name);
  const cashKey = catKeys.find(k => k.includes('現金') || k.includes('預金')) || catKeys[catKeys.length - 1];
  const cP   = ((cats[cashKey] || 0) / lat.total * 100).toFixed(1);
  const sP   = (100 - parseFloat(cP)).toFixed(1);
  const lastR = rets[rets.length - 1];

  const items = [
    {
      cls: avg >= 0 ? 'good' : 'warn',
      lbl: '月平均リターン',
      txt: `月平均 ${avg >= 0 ? '+' : ''}${avg.toFixed(2)}%。${d.length}ヶ月累積 ${totP}%（${fmt(lat.total - first.total)}）の成長。`,
    },
    {
      cls: 'info',
      lbl: '最良月・最悪月',
      txt: `最良: ${d[rets.indexOf(max) + 1].month}（+${max.toFixed(1)}%）、最悪: ${d[rets.indexOf(min) + 1].month}（${min.toFixed(1)}%）`,
    },
    {
      cls: parseFloat(sP) > 70 ? 'warn' : 'good',
      lbl: '配分バランス',
      txt: `リスク資産 ${sP}%・現金 ${cP}%。` +
           (parseFloat(sP) > 70 ? '集中度高め。分散を検討しましょう。' : 'バランスの取れた配分です。'),
    },
    {
      cls: lastR >= 0 ? 'good' : 'warn',
      lbl: '直近トレンド',
      txt: `直近前月比 ${lastR >= 0 ? '+' : ''}${lastR.toFixed(2)}%。${lastR >= 0 ? '上昇基調' : '調整局面の可能性'}。`,
    },
  ];
  document.getElementById('insightGrid').innerHTML = items.map(it =>
    `<div class="insight ${it.cls}"><div class="i-lbl">${it.lbl}</div><div class="i-txt">${it.txt}</div></div>`
  ).join('');
}

/* 月次詳細モーダル */
function showMonthDetail(d) {
  if (!d) return;
  const PAL  = pal();
  const idx  = allData.findIndex(x => x.month === d.month);
  const prev = idx > 0 ? allData[idx - 1] : null;
  const diff = prev ? d.total - prev.total : null;
  const dp   = diff !== null ? ((diff / prev.total) * 100).toFixed(1) : null;
  const cats = d.categories || {};
  const keys = categories.map(c => c.name);
  const tot  = keys.reduce((s, k) => s + (cats[k] || 0), 0) || d.total;

  document.getElementById('monthSheet').innerHTML =
    `<div class="ms-head">
       <div>
         <div class="ms-month">${d.month}</div>
         <div class="ms-total">${fmt(d.total)}</div>
         <div class="ms-diff ${diff === null ? '' : diff >= 0 ? 'td-up' : 'td-dn'}">
           ${diff !== null ? (diff >= 0 ? '▲ ' : '▼ ') + fmt(Math.abs(diff)) + ' (' + Math.abs(dp) + '%)' : '初月データ'}
         </div>
       </div>
       <button class="m-close" onclick="document.getElementById('monthModal').classList.add('hide')">×</button>
     </div>
     <div class="ms-bar">
       ${keys.filter(k => (cats[k] || 0) > 0)
             .map(k => `<div style="flex:${(cats[k]||0)/tot};background:${PAL[k]||'#888'}"></div>`)
             .join('')}
     </div>
     <div class="ms-cats">
       ${keys.filter(k => (cats[k] || 0) > 0).map(k =>
         `<div class="ms-cat-row">
            <div class="ms-cat-dot" style="background:${PAL[k]||'#888'}"></div>
            <div class="ms-cat-name">${k}</div>
            <div class="ms-cat-val">${fmt(cats[k] || 0)}</div>
            <div class="ms-cat-pct">${((cats[k]||0)/tot*100).toFixed(1)}%</div>
          </div>`
       ).join('')}
     </div>
     ${d.note ? `<div style="margin-top:11px;font-size:11px;color:var(--txt3);">${d.note}</div>` : ''}`;

  document.getElementById('monthModal').classList.remove('hide');
}

function deleteEntry(i) {
  if (!confirm(allData[i].month + ' のデータを削除しますか？')) return;
  allData.splice(i, 1);
  saveData();
  renderDashboard();
  toast('削除しました', 'success');
}
