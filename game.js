(() => {
  const c = document.getElementById('game');
  const ctx = c.getContext('2d');
  const $ = id => document.getElementById(id);

  let W = 0, H = 0, dpr = 1, audioCtx = null;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  function sfx(type) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const now = audioCtx.currentTime;
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);

      if (type === 'drop') {
        o.type = 'sine'; o.frequency.setValueAtTime(520, now); o.frequency.exponentialRampToValueAtTime(190, now + 0.55);
        g.gain.setValueAtTime(0.07, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
        o.start(now); o.stop(now + 0.6);
      } else if (type === 'splat') {
        o.type = 'triangle'; o.frequency.setValueAtTime(140, now); o.frequency.exponentialRampToValueAtTime(42, now + 0.14);
        g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.start(now); o.stop(now + 0.16);
      } else if (type === 'hit') {
        o.type = 'sine'; o.frequency.setValueAtTime(587.33, now); o.frequency.setValueAtTime(880, now + 0.07);
        g.gain.setValueAtTime(0.14, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        o.start(now); o.stop(now + 0.3);
      } else if (type === 'pwr') {
        o.type = 'triangle'; o.frequency.setValueAtTime(440, now); o.frequency.setValueAtTime(659, now + 0.08); o.frequency.setValueAtTime(880, now + 0.16);
        g.gain.setValueAtTime(0.16, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        o.start(now); o.stop(now + 0.38);
      } else if (type === 'swoop') {
        o.type = 'sine'; o.frequency.setValueAtTime(340, now); o.frequency.exponentialRampToValueAtTime(210, now + 0.16);
        g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        o.start(now); o.stop(now + 0.19);
      } else {
        o.type = 'sawtooth'; o.frequency.setValueAtTime(175, now); o.frequency.linearRampToValueAtTime(70, now + 0.28);
        g.gain.setValueAtTime(0.16, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        o.start(now); o.stop(now + 0.32);
      }
    } catch (e) {}
  }

  const CELL = 550, ROAD = 110;
  let best = 0;
  try { best = parseInt(localStorage.getItem('flyby_best') || '0', 10) || 0; } catch (e) {}
  $('best').textContent = best;

  let viewMode = 'ISO'; // 'ISO' (2.5D) or 'TOP' (2D)
  let mode = 'DEMO', time = 0, timeLeft = 45.0, score = 0, combo = 1, comboT = 0, zoom = 0.92, shake = 0;
  let lastT = performance.now();

  const bird = {
    x: 275, y: 275, z: 120, vx: 0, vy: -120, ang: -0.8, spd: 175,
    wing: 0, bank: 0, tail: 0.25, cd: 0, alt: 'HIGH',
    stun: 0, perchT: 0, perchTarget: null, pwr: null, pwrT: 0
  };

  let drops = [], splats = [], pops = [], particles = [], cars = [], peds = [], gpigs = [], haz = [], winds = [], perches = [], clouds = [];
  const hash = (x, y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };

  function emitParticles(x, y, count, col, kind = 'dot', speed = 90, z = 6) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (0.35 + Math.random() * 0.85) * speed;
      particles.push({
        x, y, z, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        ang: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 8,
        sz: kind === 'feather' ? 3.2 : 2.5 + Math.random() * 2.5,
        col, kind, life: 0.45 + Math.random() * 0.4, maxLife: 0.85
      });
    }
  }

  function updateAltUI() {
    const lo = bird.alt === 'LOW';
    $('alt-btn').classList.toggle('low', lo);
    $('alt-lbl').textContent = bird.alt;
    $('alt-bonus').textContent = lo ? 'PERCH / 1X' : '2X PTS';
  }

  window.flybyToggleView = () => {
    viewMode = viewMode === 'ISO' ? 'TOP' : 'ISO';
    const btn = $('view-btn');
    if (btn) btn.textContent = viewMode === 'ISO' ? 'VIEW: 2.5D' : 'VIEW: 2D';
    sfx('swoop');
  };

  function resetWorld() {
    timeLeft = 45.0; score = 0; combo = 1; comboT = 0; zoom = 0.92; shake = 0;
    Object.assign(bird, {
      x: 275, y: 275, z: 120, ang: -0.8, spd: 175, bank: 0, cd: 0,
      alt: 'HIGH', stun: 0, perchT: 0, perchTarget: null, pwr: null, pwrT: 0
    });
    updateAltUI();
    $('powerup-pill').classList.remove('active');
    $('timer-pill').classList.remove('urgent');
    $('timer-pill').textContent = '45.0s';
    drops = []; splats = []; pops = []; particles = [];
    cars = []; peds = []; gpigs = []; haz = []; winds = []; perches = []; clouds = [];
    spawn();
  }

  function spawn() {
    const gx0 = Math.floor(bird.x / CELL), gy0 = Math.floor(bird.y / CELL);
    const cols = ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#f8fafc', '#ec4899'];
    const hairs = ['#1e293b', '#78350f', '#facc15', '#92400e', '#cbd5e1'];

    while (cars.length < 15) {
      const gx = gx0 + ((Math.random() * 5) | 0) - 2, gy = gy0 + ((Math.random() * 5) | 0) - 2;
      const h = Math.random() > 0.5, d = Math.random() > 0.5 ? 1 : -1;
      const r = Math.random();
      const taxi = r < 0.24, conv = !taxi && r < 0.48, van = !taxi && !conv && r < 0.65;
      cars.push({
        x: h ? gx * CELL + Math.random() * CELL : gx * CELL + d * 24,
        y: h ? gy * CELL + d * 24 : gy * CELL + Math.random() * CELL,
        vx: h ? d * (105 + Math.random() * 65) : 0,
        vy: h ? 0 : d * (105 + Math.random() * 65),
        ang: h ? (d > 0 ? 0 : Math.PI) : (d > 0 ? 1.57 : -1.57),
        w: van ? 54 : 44, h: van ? 26 : 24,
        col: taxi ? '#facc15' : (van ? '#f1f5f9' : cols[(Math.random() * cols.length) | 0]),
        taxi, conv, van
      });
    }

    while (peds.length < 22) {
      const gx = gx0 + ((Math.random() * 5) | 0) - 2, gy = gy0 + ((Math.random() * 5) | 0) - 2;
      const h = Math.random() > 0.5, d = Math.random() > 0.5 ? 1 : -1;
      const off = (Math.random() > 0.5 ? 1 : -1) * (ROAD / 2 + 14);
      peds.push({
        x: h ? gx * CELL + Math.random() * CELL : gx * CELL + off,
        y: h ? gy * CELL + off : gy * CELL + Math.random() * CELL,
        vx: h ? d * (28 + Math.random() * 16) : 0,
        vy: h ? 0 : d * (28 + Math.random() * 16),
        ph: Math.random() * 6,
        col: cols[(Math.random() * cols.length) | 0],
        hair: hairs[(Math.random() * hairs.length) | 0],
        umb: Math.random() < 0.22
      });
    }

    while (gpigs.length < 12) {
      const gx = gx0 + ((Math.random() * 5) | 0) - 2, gy = gy0 + ((Math.random() * 5) | 0) - 2;
      const p = ROAD / 2 + 12;
      gpigs.push({
        x: gx * CELL + p + Math.random() * (CELL - p * 2),
        y: gy * CELL + p + Math.random() * (CELL - p * 2),
        ang: Math.random() * 6.28, ph: Math.random() * 6, sc: false, vx: 0, vy: 0
      });
    }

    while (haz.length < 5) {
      const a = Math.random() * 6.28, dist = 420 + Math.random() * 460;
      const tp = ['HELI', 'DRONE', 'HAWK'][(Math.random() * 3) | 0];
      const ma = a + Math.PI + (Math.random() - 0.5) * 0.8;
      const sp = tp === 'HAWK' ? 145 : (tp === 'HELI' ? 105 : 80);
      haz.push({
        x: bird.x + Math.cos(a) * dist, y: bird.y + Math.sin(a) * dist,
        vx: Math.cos(ma) * sp, vy: Math.sin(ma) * sp,
        ang: ma, tp, ph: Math.random() * 6, r: tp === 'HELI' ? 26 : 17
      });
    }

    while (winds.length < 3) {
      const gx = gx0 + ((Math.random() * 5) | 0) - 2, gy = gy0 + ((Math.random() * 5) | 0) - 2;
      const wx = gx * CELL + 275, wy = gy * CELL + 275;
      if (!winds.some(w => Math.hypot(w.x - wx, w.y - wy) < 350)) {
        const wa = ((Math.random() * 8) | 0) * 0.785;
        winds.push({ x: wx, y: wy, r: 145, ang: wa, fx: Math.cos(wa) * 115, fy: Math.sin(wa) * 115, ph: 0 });
      }
    }

    while (perches.length < 6) {
      const gx = gx0 + ((Math.random() * 5) | 0) - 2, gy = gy0 + ((Math.random() * 5) | 0) - 2;
      const park = hash(gx, gy) >= 0.72, p = ROAD / 2;
      const px = park ? gx * CELL + p + 95 + Math.random() * (CELL - ROAD - 190) : gx * CELL + (Math.random() > 0.5 ? p + 12 : CELL - p - 12);
      const py = park ? gy * CELL + p + 95 + Math.random() * (CELL - ROAD - 190) : gy * CELL + (Math.random() > 0.5 ? p + 12 : CELL - p - 12);
      if (!perches.some(o => Math.hypot(o.x - px, o.y - py) < 260)) {
        perches.push({
          x: px, y: py, kind: park ? 'TREE' : 'POLE',
          rew: ['RAPID', 'TRIPLE', 'MEGA'][(Math.random() * 3) | 0],
          act: true, rt: 0, pulse: Math.random() * 6
        });
      }
    }

    while (clouds.length < 7) {
      const a = Math.random() * 6.28, d = 250 + Math.random() * 900;
      clouds.push({ x: bird.x + Math.cos(a) * d, y: bird.y + Math.sin(a) * d, r: 45 + Math.random() * 45, vx: 14 + Math.random() * 12 });
    }
  }

  // --- INPUT ---
  const joy = { act: false, id: null, ox: 0, oy: 0, dx: 0, dy: 0 };
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space') window.flybyDrop();
    if (e.code === 'ShiftLeft' || e.code === 'KeyE') window.flybyToggleAlt();
    if (e.code === 'KeyV') window.flybyToggleView();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  c.addEventListener('touchstart', e => {
    if (mode !== 'PLAY') return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (!joy.act && t.clientX < W * 0.72) Object.assign(joy, { act: true, id: t.identifier, ox: t.clientX, oy: t.clientY, dx: 0, dy: 0 });
    }
  }, { passive: false });

  c.addEventListener('touchmove', e => {
    if (mode !== 'PLAY') return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (joy.act && t.identifier === joy.id) {
        let rx = t.clientX - joy.ox, ry = t.clientY - joy.oy, d = Math.hypot(rx, ry);
        if (d > 50) { rx = (rx / d) * 50; ry = (ry / d) * 50; }
        joy.dx = rx / 50; joy.dy = ry / 50;
      }
    }
  }, { passive: false });

  const endJoy = e => {
    for (const t of e.changedTouches) {
      if (joy.act && t.identifier === joy.id) Object.assign(joy, { act: false, id: null, dx: 0, dy: 0 });
    }
  };
  c.addEventListener('touchend', endJoy);
  c.addEventListener('touchcancel', endJoy);

  function flightParams() {
    const hi = bird.alt === 'HIGH';
    return { dur: hi ? 0.88 : 0.36, vx: bird.vx * (hi ? 0.48 : 0.35), vy: bird.vy * (hi ? 0.48 : 0.35), mult: hi ? 2 : 1 };
  }

  window.flybyToggleAlt = () => {
    if (mode !== 'PLAY' || bird.stun > 0) return;
    bird.alt = bird.alt === 'HIGH' ? 'LOW' : 'HIGH';
    bird.perchT = 0; bird.perchTarget = null;
    sfx('swoop');
    updateAltUI();
  };

  window.flybyDrop = () => {
    if (mode !== 'PLAY' || bird.cd > 0 || bird.stun > 0) return;
    $('drop-btn').classList.add('pressed');
    setTimeout(() => $('drop-btn').classList.remove('pressed'), 110);

    bird.cd = bird.pwr === 'RAPID' ? 0.14 : 0.52;
    sfx('drop');
    const p = flightParams();
    const angs = bird.pwr === 'TRIPLE' ? [-0.26, 0, 0.26] : [0];
    const spd = Math.hypot(p.vx, p.vy), base = Math.atan2(p.vy, p.vx);
    for (const a of angs) {
      drops.push({
        x: bird.x, y: bird.y, startZ: bird.z, vx: Math.cos(base + a) * spd, vy: Math.sin(base + a) * spd,
        el: 0, dur: p.dur, mega: bird.pwr === 'MEGA', mult: p.mult
      });
    }
  };

  window.flybyStart = () => {
    $('start-screen').style.display = 'none';
    $('over-screen').style.display = 'none';
    Object.assign(joy, { act: false, dx: 0, dy: 0 });
    resetWorld();
    mode = 'PLAY';
    lastT = performance.now();
  };

  // --- IMPACT ---
  function impact(d) {
    sfx('splat');
    emitParticles(d.x, d.y, d.mega ? 16 : 7, d.mega ? '#fef08a' : '#ffffff', 'dot', d.mega ? 130 : 75, 4);
    if (d.mega) shake = Math.max(shake, 0.45);

    const pad = d.mega ? 38 : 0, sr = d.mega ? 22 : 8;
    let pts = 0, lbl = '', col = '#ffffff', mov = false;

    for (const car of cars) {
      const cos = Math.cos(-car.ang), sin = Math.sin(-car.ang), dx = d.x - car.x, dy = d.y - car.y;
      if (Math.abs(dx * cos - dy * sin) <= car.w * 0.55 + pad && Math.abs(dx * sin + dy * cos) <= car.h * 0.55 + pad) {
        mov = true;
        pts += car.conv ? 200 : (car.taxi ? 130 : 100);
        lbl = car.conv ? 'CONVERTIBLE!' : (car.taxi ? 'YELLOW CAB!' : 'CAR HIT!');
        col = '#fde047';
        splats.push({ x: d.x, y: d.y, car, ox: Math.max(-14, Math.min(14, dx)), oy: Math.max(-8, Math.min(8, dy)), r: sr });
        if (!d.mega) break;
      }
    }

    if (!mov || d.mega) {
      for (const p of peds) {
        if (Math.hypot(d.x - p.x, d.y - p.y) < 16 + pad) {
          mov = true;
          pts += p.umb ? 30 : 65;
          if (!lbl) { lbl = p.umb ? 'UMBRELLA!' : 'BULLSEYE!'; col = '#38bdf8'; }
          p.vx *= 1.75; p.vy *= 1.75;
          if (!d.mega) break;
        }
      }
    }

    if (!pts) {
      const gx = Math.floor(d.x / CELL), gy = Math.floor(d.y / CELL);
      const lx = ((d.x % CELL) + CELL) % CELL, ly = ((d.y % CELL) + CELL) % CELL;
      if (lx > ROAD / 2 && lx < CELL - ROAD / 2 && ly > ROAD / 2 && ly < CELL - ROAD / 2) {
        pts = hash(gx, gy) < 0.72 ? 15 : 5;
        lbl = pts === 15 ? 'ROOFTOP' : 'TREETOP';
        col = pts === 15 ? '#cbd5e1' : '#86efac';
      }
    }

    splats.push({ x: d.x, y: d.y, r: sr });

    if (pts) {
      sfx('hit');
      const earn = pts * combo * d.mult;
      score += earn;
      if (mov) { combo = Math.min(combo + 1, 10); comboT = 4.2; }
      pops.push({ x: d.x, y: d.y - 12, txt: `${lbl}${d.mult > 1 ? ' (2X)' : ''} +${earn}`, col, life: 1.05 });
    } else {
      combo = 1; comboT = 0;
    }
    if (splats.length > 75) splats.shift();
  }

  // --- UPDATE ---
  function update(dt) {
    time += dt;
    if (shake > 0) shake = Math.max(0, shake - dt * 2.2);

    if (mode === 'PLAY') {
      timeLeft = Math.max(0, timeLeft - dt);
      $('timer-pill').textContent = timeLeft.toFixed(1) + 's';
      $('timer-pill').classList.toggle('urgent', timeLeft <= 10.0);
      if (timeLeft <= 0) {
        mode = 'OVER';
        $('f-score').textContent = score;
        if (score > best) {
          best = score;
          try { localStorage.setItem('flyby_best', String(best)); } catch (e) {}
          $('best').textContent = best;
          $('rec-msg').style.display = 'block';
        } else {
          $('rec-msg').style.display = 'none';
        }
        $('f-best').textContent = best;
        $('over-screen').style.display = 'flex';
        return;
      }
    }

    const tZoom = mode === 'DEMO' ? 0.92 : (bird.alt === 'HIGH' ? 0.84 : 1.12);
    zoom += (tZoom - zoom) * 6 * dt;

    const targetZ = bird.alt === 'HIGH' ? 120 : 46;
    bird.z += (targetZ - bird.z) * 7 * dt;

    if (bird.cd > 0) {
      bird.cd = Math.max(0, bird.cd - dt);
      $('ammo-status').textContent = bird.cd > 0 ? bird.cd.toFixed(1) + 's' : 'READY';
    }
    if (bird.stun > 0) bird.stun = Math.max(0, bird.stun - dt);

    if (bird.pwrT > 0) {
      bird.pwrT -= dt;
      const names = { RAPID: 'RAPID FIRE', TRIPLE: 'TRIPLE SEED', MEGA: 'MEGA SPLAT' };
      $('powerup-pill').textContent = `${names[bird.pwr]} ${bird.pwrT.toFixed(1)}s`;
      $('powerup-pill').classList.add('active');
      if (bird.pwrT <= 0) { bird.pwr = null; $('powerup-pill').classList.remove('active'); }
    }

    if (comboT > 0) { comboT -= dt; if (comboT <= 0) combo = 1; }
    $('score').textContent = score;
    $('combo').textContent = combo;
    $('combo-pill').classList.toggle('active', combo > 1 && mode === 'PLAY');

    if (mode === 'DEMO') {
      bird.ang += 0.42 * dt; bird.bank = 0.3; bird.spd = 155; bird.tail = 0.35;
    } else {
      let ix = joy.dx + (keys['ArrowRight'] || keys['KeyD'] ? 1 : 0) - (keys['ArrowLeft'] || keys['KeyA'] ? 1 : 0);
      let iy = joy.dy + (keys['ArrowDown'] || keys['KeyS'] ? 1 : 0) - (keys['ArrowUp'] || keys['KeyW'] ? 1 : 0);
      const mag = Math.hypot(ix, iy);

      if (bird.stun > 0) {
        bird.ang += 9 * dt; bird.spd = 60; bird.tail = 0.85;
      } else if (mag > 0.12) {
        // Rotate screen joystick angle by -45° in 2.5D isometric mode so Up=Up on screen
        const targetAng = Math.atan2(iy, ix) - (viewMode === 'ISO' ? Math.PI / 4 : 0);
        let diff = targetAng - bird.ang;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        bird.ang += Math.sign(diff) * Math.min(Math.abs(diff), 5.0 * dt);
        bird.bank += (Math.max(-1, Math.min(1, diff * 2)) - bird.bank) * 8 * dt;
        bird.spd = (bird.alt === 'LOW' ? 155 : 175) + Math.min(mag, 1) * 70;
        const tTail = Math.min(0.85, 0.2 + Math.abs(bird.bank) * 0.45 + (bird.alt === 'LOW' ? 0.25 : 0));
        bird.tail += (tTail - bird.tail) * 7 * dt;
      } else {
        bird.bank *= Math.pow(0.05, dt);
        bird.spd += ((bird.alt === 'LOW' ? 140 : 165) - bird.spd) * 4 * dt;
        bird.tail += ((bird.alt === 'LOW' ? 0.42 : 0.18) - bird.tail) * 6 * dt;
      }
    }

    bird.vx = Math.cos(bird.ang) * bird.spd;
    bird.vy = Math.sin(bird.ang) * bird.spd;

    if (mode === 'PLAY') {
      for (const w of winds) {
        w.ph += dt * 3;
        if (Math.hypot(bird.x - w.x, bird.y - w.y) < w.r) {
          bird.x += w.fx * dt;
          bird.y += w.fy * dt;
        }
      }
    }

    bird.x += bird.vx * dt;
    bird.y += bird.vy * dt;
    bird.wing += dt * (11.5 + bird.spd * 0.035);

    if (mode === 'PLAY') {
      for (const p of perches) {
        p.pulse += dt * 4;
        if (!p.act) {
          p.rt -= dt;
          if (p.rt <= 0) p.act = true;
          continue;
        }
        if (Math.hypot(bird.x - p.x, bird.y - p.y) < 30 && bird.alt === 'LOW' && bird.stun <= 0) {
          bird.x += (p.x - bird.x) * 8 * dt;
          bird.y += (p.y - bird.y) * 8 * dt;
          bird.perchT += dt;
          bird.perchTarget = p;
          bird.tail = 0.9;
          if (bird.perchT >= 0.22) {
            p.act = false; p.rt = 14;
            bird.perchT = 0; bird.perchTarget = null;
            bird.pwr = p.rew; bird.pwrT = 8.0;
            sfx('pwr');
            emitParticles(p.x, p.y, 14, '#fde047', 'dot', 110, 32);
            const lbls = { RAPID: 'BERRY FEAST: RAPID FIRE!', TRIPLE: 'NEST SEEDS: TRIPLE DROP!', MEGA: 'GOLDEN ACORN: MEGA SPLAT!' };
            pops.push({ x: p.x, y: p.y - 24, txt: lbls[p.rew], col: '#fde047', life: 1.3 });
          }
        } else if (bird.perchTarget === p) {
          bird.perchT = 0; bird.perchTarget = null;
        }
      }
    }

    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.el += dt; d.x += d.vx * dt; d.y += d.vy * dt;
      for (const w of winds) {
        if (Math.hypot(d.x - w.x, d.y - w.y) < w.r) {
          d.x += w.fx * 0.85 * dt; d.y += w.fy * 0.85 * dt;
        }
      }
      if (d.el >= d.dur) { impact(d); drops.splice(i, 1); }
    }

    for (let i = haz.length - 1; i >= 0; i--) {
      const h = haz[i];
      h.x += h.vx * dt; h.y += h.vy * dt; h.ph += dt * 28;
      if (mode === 'PLAY' && bird.alt === 'HIGH' && bird.stun <= 0) {
        if (Math.hypot(bird.x - h.x, bird.y - h.y) < h.r + 12) {
          bird.stun = 1.1; combo = 1; comboT = 0; shake = Math.max(shake, 0.55);
          sfx('bonk');
          emitParticles(bird.x, bird.y, 12, '#cbd5e1', 'feather', 115, bird.z);
          pops.push({ x: bird.x, y: bird.y - 20, txt: `${h.tp} HIT! SWOOP LOW!`, col: '#f87171', life: 1.3 });
        }
      }
      if (Math.hypot(h.x - bird.x, h.y - bird.y) > 1650) haz.splice(i, 1);
    }

    for (let i = cars.length - 1; i >= 0; i--) {
      cars[i].x += cars[i].vx * dt; cars[i].y += cars[i].vy * dt;
      if (Math.hypot(cars[i].x - bird.x, cars[i].y - bird.y) > 1650) cars.splice(i, 1);
    }

    for (let i = peds.length - 1; i >= 0; i--) {
      peds[i].x += peds[i].vx * dt; peds[i].y += peds[i].vy * dt; peds[i].ph += dt * 10;
      if (Math.hypot(peds[i].x - bird.x, peds[i].y - bird.y) > 1550) peds.splice(i, 1);
    }

    for (let i = gpigs.length - 1; i >= 0; i--) {
      const g = gpigs[i];
      g.ph += dt * 9;
      if (!g.sc && bird.alt === 'LOW' && Math.hypot(g.x - bird.x, g.y - bird.y) < 75) {
        g.sc = true;
        const a = Math.atan2(g.y - bird.y, g.x - bird.x) + (Math.random() - 0.5) * 0.5;
        g.ang = a; g.vx = Math.cos(a) * 140; g.vy = Math.sin(a) * 140;
      }
      if (g.sc) { g.x += g.vx * dt; g.y += g.vy * dt; }
      if (Math.hypot(g.x - bird.x, g.y - bird.y) > 1500) gpigs.splice(i, 1);
    }

    for (let i = clouds.length - 1; i >= 0; i--) {
      clouds[i].x += clouds[i].vx * dt;
      if (Math.hypot(clouds[i].x - bird.x, clouds[i].y - bird.y) > 1650) clouds.splice(i, 1);
    }

    for (let i = winds.length - 1; i >= 0; i--) {
      if (Math.hypot(winds[i].x - bird.x, winds[i].y - bird.y) > 1700) winds.splice(i, 1);
    }

    for (let i = perches.length - 1; i >= 0; i--) {
      if (Math.hypot(perches[i].x - bird.x, perches[i].y - bird.y) > 1700) perches.splice(i, 1);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.ang += pt.spin * dt; pt.life -= dt;
      if (pt.life <= 0) particles.splice(i, 1);
    }

    for (const s of splats) {
      if (s.car) { s.x = s.car.x + s.ox; s.y = s.car.y + s.oy; }
    }

    for (let i = pops.length - 1; i >= 0; i--) {
      pops[i].y -= 36 * dt; pops[i].life -= dt;
      if (pops[i].life <= 0) pops.splice(i, 1);
    }

    spawn();
  }

  // --- LOOP ---
  resetWorld();
  function loop(now) {
    const dt = Math.min((now - lastT) / 1000, 0.05);
    lastT = now;
    if (mode !== 'OVER') update(dt);
    if (window.FlybyRender) {
      window.FlybyRender.render(ctx, {
        W, H, zoom, mode, viewMode, time, bird, cars, peds, gpigs, drops, splats, pops,
        particles, haz, winds, perches, clouds, joy, shake, CELL, ROAD, hash, flightParams
      });
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
