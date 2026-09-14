(function () {
  function rng(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeField(seed) {
    const random = rng(seed);
    const bumps = [];
    for (let i = 0; i < 8; i++) {
      bumps.push({
        x: random(),
        y: random(),
        s: 0.1 + random() * 0.2,
        h: (random() > 0.3 ? 1 : -0.7) * (0.5 + random())
      });
    }
    return function (x, y) {
      let v = 0.3 * x - 0.2 * y;
      for (const b of bumps) {
        const dx = x - b.x;
        const dy = y - b.y;
        v += b.h * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s));
      }
      return v;
    };
  }

  const CASES = {
    1: ['l', 'b'], 2: ['b', 'r'], 3: ['l', 'r'], 4: ['t', 'r'],
    5: ['l', 't', 'b', 'r'], 6: ['t', 'b'], 7: ['l', 't'], 8: ['l', 't'],
    9: ['t', 'b'], 10: ['l', 'b', 't', 'r'], 11: ['t', 'r'], 12: ['l', 'r'],
    13: ['b', 'r'], 14: ['l', 'b']
  };

  function draw(canvas, field) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const styles = getComputedStyle(canvas);
    const minor = styles.getPropertyValue('--topo').trim();
    const major = styles.getPropertyValue('--topo-index').trim();

    const step = 6;
    const cols = Math.ceil(rect.width / step) + 1;
    const rows = Math.ceil(rect.height / step) + 1;
    const unit = Math.max(rect.width, rect.height);
    const values = new Float32Array(cols * rows);
    let lo = Infinity;
    let hi = -Infinity;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const v = field((i * step) / unit, (j * step) / unit);
        values[j * cols + i] = v;
        if (v < lo) lo = v;
        if (v > hi) hi = v;
      }
    }

    const interval = (hi - lo) / 26;
    for (let k = Math.ceil(lo / interval); k <= Math.floor(hi / interval); k++) {
      const level = k * interval;
      const isIndex = k % 5 === 0;
      ctx.beginPath();
      ctx.strokeStyle = isIndex ? major : minor;
      ctx.lineWidth = isIndex ? 1.4 : 0.9;

      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = values[j * cols + i];
          const b = values[j * cols + i + 1];
          const c = values[(j + 1) * cols + i + 1];
          const d = values[(j + 1) * cols + i];
          const code = (a > level ? 8 : 0) | (b > level ? 4 : 0) | (c > level ? 2 : 0) | (d > level ? 1 : 0);
          if (code === 0 || code === 15) continue;

          const x = i * step;
          const y = j * step;
          const edge = {
            t: [x + step * ((level - a) / (b - a)), y],
            r: [x + step, y + step * ((level - b) / (c - b))],
            b: [x + step * ((level - d) / (c - d)), y + step],
            l: [x, y + step * ((level - a) / (d - a))]
          };
          const seg = CASES[code];
          for (let s = 0; s < seg.length; s += 2) {
            ctx.moveTo(edge[seg[s]][0], edge[seg[s]][1]);
            ctx.lineTo(edge[seg[s + 1]][0], edge[seg[s + 1]][1]);
          }
        }
      }
      ctx.stroke();
    }
  }

  const items = Array.from(document.querySelectorAll('canvas.topo')).map(function (canvas) {
    return { canvas: canvas, field: makeField(Number(canvas.dataset.seed) || 1) };
  });

  function drawAll() {
    items.forEach(function (item) {
      draw(item.canvas, item.field);
    });
  }

  let frame = 0;
  function schedule() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(drawAll);
  }

  drawAll();
  window.addEventListener('resize', schedule);})();
