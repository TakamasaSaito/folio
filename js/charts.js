/* ===== Chart.js ラッパー ===== */

/* 共通ツールチップオプション */
const tooltipDefaults = {
  backgroundColor: 'rgba(16,19,31,.97)',
  titleColor: '#c9a84c',
  bodyColor: '#dde2ee',
  borderColor: 'rgba(201,168,76,.3)',
  borderWidth: 1,
  padding: 12,
};

function renderLineChart() {
  const d = fd();
  const ctx = document.getElementById('lineChart').getContext('2d');
  if (charts.line) charts.line.destroy();

  const { grid } = gc();
  const g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, 'rgba(201,168,76,.2)');
  g.addColorStop(1, 'rgba(201,168,76,0)');

  charts.line = new Chart(ctx, {
    type: 'line',
    data: {
      labels: d.map(x => x.month),
      datasets: [{
        label: '総資産',
        data: d.map(x => x.total),
        borderColor: '#c9a84c',
        backgroundColor: g,
        borderWidth: 2.5,
        pointRadius: 5,
        pointHoverRadius: 9,
        tension: .4,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults, displayColors: false,
          callbacks: { label: c => fmt(c.raw) } },
      },
      scales: {
        x: { grid: { color: grid }, ticks: { color: '#3e4560', font: { size: 8 } } },
        y: { grid: { color: grid }, ticks: { color: '#3e4560', font: { size: 8 }, callback: v => fmtS(v) } },
      },
      onClick: (e, els) => { if (els.length) showMonthDetail(d[els[0].index]); },
    },
  });
}

function renderDonutChart() {
  const lat = allData[allData.length - 1];
  const cats = lat.categories || {};
  const PAL = pal();
  const lbs = Object.keys(cats).filter(k => cats[k] > 0);
  const ctx = document.getElementById('donutChart').getContext('2d');
  if (charts.donut) charts.donut.destroy();

  charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: lbs,
      datasets: [{
        data: lbs.map(k => cats[k]),
        backgroundColor: lbs.map(k => PAL[k] || '#888'),
        borderWidth: 2,
        borderColor: '#10131f',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#3e4560', font: { size: 10 }, padding: 12 } },
        tooltip: { ...tooltipDefaults, padding: 10,
          callbacks: { label: c => `${c.label}: ${fmt(c.raw)}` } },
      },
    },
  });
}

function renderBarChart() {
  const d = fd();
  const PAL = pal();
  const ctx = document.getElementById('barChart').getContext('2d');
  if (charts.bar) charts.bar.destroy();
  const { grid } = gc();

  const makeGrad = c => {
    const color = PAL[c.name] || c.color || '#888';
    const g = ctx.createLinearGradient(0, 0, 0, 230);
    g.addColorStop(0, color + 'f2');
    g.addColorStop(.65, color + 'aa');
    g.addColorStop(1, color + '66');
    return g;
  };

  charts.bar = new Chart(ctx, {
    data: {
      labels: d.map(x => x.month),
      datasets: [
        ...categories.map((c, i) => ({
          type: 'bar',
          label: c.name,
          data: d.map(x => (x.categories || {})[c.name] || 0),
          backgroundColor: makeGrad(c),
          borderColor: (PAL[c.name] || c.color || '#888') + 'f5',
          borderWidth: { top: i === categories.length - 1 ? 1 : 0 },
          borderRadius: i === categories.length - 1 ? { topLeft: 9, topRight: 9 } : 0,
          borderSkipped: false,
          barPercentage: .72,
          categoryPercentage: .78,
          stack: 'assets',
          order: 2,
        })),
        {
          type: 'line',
          label: '総資産ライン',
          data: d.map(x => x.total),
          borderColor: '#f5dfa0',
          backgroundColor: 'rgba(245,223,160,.12)',
          borderWidth: 2,
          pointRadius: d.map((_, i) => i === d.length - 1 ? 5 : 2.5),
          pointHoverRadius: 7,
          pointBackgroundColor: '#07080e',
          pointBorderColor: '#f5dfa0',
          pointBorderWidth: 2,
          tension: .38,
          fill: false,
          order: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            color: '#8b92a8',
            font: { size: 10, family: 'JetBrains Mono' },
            boxWidth: 26,
            boxHeight: 8,
            padding: 14,
            useBorderRadius: true,
            borderRadius: 6,
          },
        },
        tooltip: { ...tooltipDefaults, padding: 12, displayColors: true,
          callbacks: {
            title: items => `${items[0].label} の内訳`,
            label: c => `${c.dataset.label}: ${fmt(c.raw)}`,
            footer: items => {
              const sum = items.filter(i => i.dataset.type === 'bar').reduce((a, i) => a + i.raw, 0);
              return '合計: ' + fmt(sum);
            },
          } },
      },
      scales: {
        x: {
          stacked: true,
          grid: { color: 'rgba(255,255,255,.025)', drawBorder: false },
          ticks: { color: '#59617c', font: { size: 9, family: 'JetBrains Mono' }, maxRotation: 0 },
        },
        y: {
          stacked: true,
          grid: { color: grid, drawBorder: false },
          border: { display: false },
          ticks: { color: '#59617c', font: { size: 9, family: 'JetBrains Mono' }, callback: v => fmtS(v) },
        },
      },
      onClick: (e, els) => { if (els.length) showMonthDetail(d[els[0].index]); },
    },
  });
}

function renderVolatilityChart(rets) {
  const { grid } = gc();
  const ctx = document.getElementById('volatilityChart').getContext('2d');
  if (charts.vol) charts.vol.destroy();

  charts.vol = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: allData.slice(1).map(d => d.month),
      datasets: [{
        data: rets,
        backgroundColor: rets.map(r => r >= 0 ? 'rgba(45,212,160,.6)' : 'rgba(240,92,110,.6)'),
        borderRadius: 3,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { ...tooltipDefaults, padding: 10,
          callbacks: { label: c => (c.raw >= 0 ? '+' : '') + c.raw.toFixed(2) + '%' } },
      },
      scales: {
        x: { grid: { color: grid }, ticks: { color: '#3e4560', font: { size: 8 } } },
        y: { grid: { color: grid }, ticks: { color: '#3e4560', font: { size: 8 }, callback: v => v + '%' } },
      },
    },
  });
}

function renderSimChart(lbls, vals, contrib, target) {
  const { grid } = gc();
  const ctx = document.getElementById('simChart').getContext('2d');
  if (charts.sim) charts.sim.destroy();

  const g = ctx.createLinearGradient(0, 0, 0, 200);
  g.addColorStop(0, 'rgba(201,168,76,.15)');
  g.addColorStop(1, 'rgba(201,168,76,0)');

  charts.sim = new Chart(ctx, {
    type: 'line',
    data: {
      labels: lbls,
      datasets: [
        { label: '予測資産', data: vals,   borderColor: '#c9a84c', backgroundColor: g, borderWidth: 2, tension: .4, fill: true, pointRadius: 2 },
        { label: '元本',     data: contrib, borderColor: '#4a5068', borderDash: [4,4], borderWidth: 1.5, fill: false, pointRadius: 0 },
        { label: '目標',     data: lbls.map(() => target), borderColor: '#2dd4a0', borderDash: [6,3], borderWidth: 1.5, fill: false, pointRadius: 0 },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#3e4560', font: { size: 9 } } },
        tooltip: { ...tooltipDefaults, callbacks: { label: c => `${c.dataset.label}: ${fmt(c.raw)}` } },
      },
      scales: {
        x: { grid: { color: grid }, ticks: { color: '#3e4560', font: { size: 8 } } },
        y: { grid: { color: grid }, ticks: { color: '#3e4560', font: { size: 8 }, callback: v => fmtS(v) } },
      },
    },
  });
}

function renderScenarioChart(lbls, base, monthly, months) {
  const { grid } = gc();
  const ctx = document.getElementById('scenarioChart').getContext('2d');
  if (charts.scen) charts.scen.destroy();

  const scenarios = [
    { rate: 2, label: '弱気 2%', c: '#f05c6e' },
    { rate: 5, label: '中立 5%', c: '#f5a623' },
    { rate: 8, label: '強気 8%', c: '#2dd4a0' },
  ];

  charts.scen = new Chart(ctx, {
    type: 'line',
    data: {
      labels: lbls,
      datasets: scenarios.map(s => {
        const mr = s.rate / 100 / 12;
        let sv = base;
        const sv2 = [base];
        for (let m = 1; m <= months; m++) {
          sv = sv * (1 + mr) + monthly;
          if (m % 12 === 0) sv2.push(Math.round(sv));
        }
        return { label: s.label, data: sv2, borderColor: s.c, borderWidth: 2, tension: .4, fill: false, pointRadius: 1 };
      }),
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#3e4560', font: { size: 9 } } },
        tooltip: { ...tooltipDefaults, callbacks: { label: c => `${c.dataset.label}: ${fmt(c.raw)}` } },
      },
      scales: {
        x: { grid: { color: grid }, ticks: { color: '#3e4560', font: { size: 8 } } },
        y: { grid: { color: grid }, ticks: { color: '#3e4560', font: { size: 8 }, callback: v => fmtS(v) } },
      },
    },
  });
}

function renderSparkline(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (sparkChart) sparkChart.destroy();

  const vals = allData.map(d => d.total);
  const labels = allData.map(d => d.month);
  const isUp = vals[vals.length - 1] >= vals[0];
  const color = isUp ? '#2dd4a0' : '#f05c6e';
  const g = ctx.createLinearGradient(0, 0, 0, 96);
  g.addColorStop(0, isUp ? 'rgba(45,212,160,.06)' : 'rgba(240,92,110,.06)');
  g.addColorStop(.72, isUp ? 'rgba(45,212,160,.025)' : 'rgba(240,92,110,.025)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  const yMin = Math.min(...vals) * .95;

  sparkChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: vals,
        borderColor: color,
        backgroundColor: g,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: .6,
        fill: true,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: 'easeOutQuart' },
      layout: { padding: { top: 8, right: 10, bottom: 4, left: 10 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          ...tooltipDefaults,
          displayColors: false,
          callbacks: {
            title: items => items[0].label,
            label: c => fmt(c.parsed.y),
          },
        },
      },
      interaction: { intersect: false, mode: 'index' },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          border: { display: false },
          ticks: {
            color: '#3e4560',
            font: { size: 9, family: 'JetBrains Mono' },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 5,
          },
        },
        y: {
          display: false,
          min: yMin,
        },
      },
    },
  });
}
