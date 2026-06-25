/* ===== 将来シミュレーション ===== */

function runSim() {
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

  document.getElementById('simResults').innerHTML = `
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
