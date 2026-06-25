/* ===== 将来シミュレーション ===== */

let simInitialized = false;

const RATE_CAP = 20;

function calcHistoricalStats() {
  if (allData.length < 2) return { avgRate: null, avgContrib: null, capped: false };

  // 利回り: 期間全体のCAGR（月次単純平均は外れ値を指数増幅するため不使用）
  const first  = allData[0].total;
  const last   = allData[allData.length - 1].total;
  const years  = (allData.length - 1) / 12;
  let avgRate  = null;
  if (first > 0 && last > 0 && years > 0) {
    avgRate = (Math.pow(last / first, 1 / years) - 1) * 100;
  }

  // 積立額: 月次増加額の上下10%トリム平均（外れ値の影響を抑制）
  const increases = [];
  for (let i = 1; i < allData.length; i++) {
    const diff = allData[i].total - allData[i - 1].total;
    if (diff > 0) increases.push(diff);
  }
  let avgContrib = null;
  if (increases.length > 0) {
    increases.sort((a, b) => a - b);
    const cut = Math.floor(increases.length * 0.1);
    const trimmed = cut > 0 ? increases.slice(cut, -cut) : increases;
    avgContrib = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }

  const capped = avgRate !== null && avgRate > RATE_CAP;
  if (capped) avgRate = RATE_CAP;

  return { avgRate, avgContrib, capped };
}

function initSimInputs() {
  const { avgRate, avgContrib } = calcHistoricalStats();
  if (avgRate !== null) {
    document.getElementById('simRate').value = Math.max(0, avgRate).toFixed(1);
  }
  if (avgContrib !== null) {
    document.getElementById('simMonthly').value = Math.round(avgContrib);
  }
  // データが不十分な場合はデフォルト値を維持（HTML初期値: 5%, 50000円）
}

function runSim() {
  if (!simInitialized && allData.length >= 2) {
    initSimInputs();
    simInitialized = true;
  }

  const base    = allData.length ? allData[allData.length - 1].total : 0;
  const monthly = parseFloat(document.getElementById('simMonthly').value) || 0;
  const rate    = parseFloat(document.getElementById('simRate').value) || 5;
  const years   = parseInt(document.getElementById('simYears').value) || 20;
  const target  = (parseFloat(document.getElementById('simTarget').value) || 3000) * 10000;

  const mr     = rate / 100 / 12;
  const months = years * 12;
  const lbls   = [];
  const vals   = [];
  const contrib = [];
  let v = base;
  let tgtM = null;
  let vt = base;

  for (let m = 0; m <= months; m++) {
    if (m > 0) v = v * (1 + mr) + monthly;
    if (m % 12 === 0) {
      lbls.push(m === 0 ? '現在' : `+${m / 12}年`);
      vals.push(Math.round(v));
      contrib.push(Math.round(base + monthly * m));
    }
  }
  for (let m = 1; m <= months * 3; m++) {
    vt = vt * (1 + mr) + monthly;
    if (vt >= target && !tgtM) { tgtM = m; break; }
  }

  const finalV = vals[vals.length - 1];
  const gain   = finalV - (base + monthly * months);

  const { avgRate, avgContrib, capped } = calcHistoricalStats();
  const hasHist = avgRate !== null || avgContrib !== null;
  const capNote = capped
    ? `<div class="sim-hist-cap">過去実績が高すぎるため${RATE_CAP}%に制限しています</div>`
    : '';
  const histHtml = hasHist ? `
    <div class="sim-hist-banner">
      <div class="sim-hist-ttl">Past Performance</div>
      <div class="sim-hist-row">
        ${avgRate !== null ? `<span>過去平均利回り（CAGR） <b>${Math.max(0, avgRate).toFixed(1)}%</b></span>` : ''}
        ${avgContrib !== null ? `<span>過去平均積立額 <b>${fmt(Math.round(avgContrib))}</b></span>` : ''}
      </div>
      ${capNote}
      <div class="sim-hist-note">これをベースに予測しています</div>
    </div>` : '';

  document.getElementById('simResults').innerHTML = `
    ${histHtml}
    <div class="sim-res hero">
      <div class="sim-res-lbl">${years}年後の予測</div>
      <div class="sim-res-val">${fmt(finalV)}</div>
    </div>
    <div class="sim-res">
      <div class="sim-res-lbl">うち運用益</div>
      <div class="sim-res-val" style="color:var(--gold)">${fmt(gain)}</div>
    </div>
    <div class="sim-res">
      <div class="sim-res-lbl">目標達成</div>
      <div class="sim-res-val" style="color:${tgtM ? 'var(--em)' : 'var(--ruby)'}">
        ${tgtM ? `約${Math.ceil(tgtM / 12)}年後` : `${years}年超`}
      </div>
    </div>`;

  const histData = allData.length >= 2
    ? { labels: allData.map(d => d.month), vals: allData.map(d => d.total) }
    : null;

  renderSimChart(lbls, vals, contrib, target, histData);
  renderScenarioChart(lbls, base, monthly, months);
}
