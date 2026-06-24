/* ===== リスク診断 ===== */

function renderRisk() {
  if (allData.length < 2) {
    document.getElementById('riskHero').innerHTML =
      '<div style="color:var(--txt3);font-size:12px;padding:10px 0;">2ヶ月以上のデータが必要です</div>';
    document.getElementById('riskMeters').innerHTML = '';
    document.getElementById('riskAdvice').innerHTML = '';
    return;
  }

  const lat     = allData[allData.length - 1];
  const cats    = lat.categories || {};
  const tot     = lat.total;
  const n       = allData.length;
  const catKeys = categories.map(c => c.name);
  const cashKey = catKeys.find(k => k.includes('現金') || k.includes('預金')) || catKeys[catKeys.length - 1];

  const cP      = (cats[cashKey] || 0) / tot * 100;
  const riskPct = 100 - cP;

  /* 月次リターン配列 */
  const rets = [];
  for (let i = 1; i < n; i++)
    rets.push((allData[i].total - allData[i - 1].total) / allData[i - 1].total * 100);

  const avg = rets.reduce((a, b) => a + b, 0) / rets.length;
  const std = Math.sqrt(rets.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / rets.length);

  /* スコア計算（3軸） */
  const dS    = Math.min(100, Math.round(
    (cP > 5 ? 20 : 0) +
    (Object.values(cats).filter(v => v > 0).length >= 3 ? 30 : 0) +
    (riskPct < 80 ? 25 : 0) + 25
  ));
  const vS    = Math.max(0, Math.min(100, Math.round(100 - std * 10)));
  const cashS = Math.min(100, Math.round(cP * 2));
  const ov    = Math.round((dS + vS + cashS) / 3);
  const oc    = ov >= 70 ? '#2dd4a0' : ov >= 45 ? '#f5a623' : '#f05c6e';
  const verdict = ov >= 70 ? '安定したポートフォリオ' : ov >= 45 ? '要改善の余地あり' : '高リスク状態';

  /* ヒーロースコア */
  document.getElementById('riskHero').innerHTML =
    `<div class="score-hero">
       <div class="score-big" style="color:${oc}">${ov}</div>
       <div style="flex:1;">
         <div class="sc-lbl">Risk Score / 100</div>
         <div class="sc-verdict" style="color:${oc}">${verdict}</div>
         <div class="sc-bar"><div class="sc-fill" style="width:${ov}%;background:${oc}"></div></div>
         <div class="sc-desc">スコアが高いほど安定したポートフォリオです</div>
       </div>
     </div>`;

  /* 3軸メーター */
  const meters = [
    { name: '分散度', score: dS,    desc: '配分バランス' },
    { name: '安定性', score: vS,    desc: '低ボラティリティ' },
    { name: '流動性', score: cashS, desc: '現金比率' },
  ];
  document.getElementById('riskMeters').innerHTML = meters.map(m => {
    const c = m.score >= 70 ? '#2dd4a0' : m.score >= 40 ? '#f5a623' : '#f05c6e';
    return `<div class="rmeter">
      <div class="rmeter-name">${m.name}</div>
      <div class="rmeter-score" style="color:${c}">${m.score}</div>
      <div class="rmeter-bar"><div class="rmeter-fill" style="width:${m.score}%;background:${c}"></div></div>
      <div class="rmeter-desc">${m.desc}</div>
    </div>`;
  }).join('');

  /* アドバイス */
  const advClass = c => c === '#f05c6e' ? 'adv-bad' : c === '#f5a623' ? 'adv-warn' : 'adv-good';
  const advices = [
    {
      t: `リスク資産比率 ${riskPct.toFixed(0)}%`,
      p: riskPct > 80
        ? 'リスク資産が高め。現金比率10〜20%の確保を推奨します。'
        : riskPct < 30
          ? '現金比率が多め。投信等への移行を検討。'
          : '適切な水準です。定期的なリバランスを。',
      c: riskPct > 80 ? '#f05c6e' : riskPct < 30 ? '#f5a623' : '#2dd4a0',
    },
    {
      t: `月次ボラティリティ ${std.toFixed(2)}%`,
      p: std > 5
        ? '変動が大きい状態です。急落局面でも積立継続が重要です。'
        : '変動は小さく安定しています。',
      c: std > 5 ? '#f5a623' : '#2dd4a0',
    },
    {
      t: `現金比率 ${cP.toFixed(1)}%`,
      p: cP < 10
        ? '緊急資金不足の可能性。生活費6ヶ月分の現金確保を推奨。'
        : cP > 40
          ? '現金比率がやや高め。余剰資金の運用を検討。'
          : '現金比率はバランスが取れています。',
      c: cP < 10 ? '#f05c6e' : cP > 40 ? '#f5a623' : '#2dd4a0',
    },
  ];
  document.getElementById('riskAdvice').innerHTML = advices.map(a =>
    `<div class="adv-item ${advClass(a.c)}"><b>${a.t}</b><p>${a.p}</p></div>`
  ).join('');

  renderVolatilityChart(rets);
}
