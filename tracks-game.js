(() => {
  const c = document.getElementById('c');
  const ctx = c.getContext('2d');
  const $ = id => document.getElementById(id);

  let W = 0, H = 0, dpr = 1, audio = null;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  window.addEventListener('resize', resize);
  resize();

  function tone(freq, dur, type = 'sine', vol = 0.06) {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const t = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(audio.destination);
      o.start(t); o.stop(t + dur);
    } catch (e) {}
  }

  const SIZES = [6, 8, 12];
  let sizeIdx = 1, N = SIZES[sizeIdx], iso = false, tool = 'auto', time = 0;
  const sz = 68;
  const cam = { x: 0, y: -15, zoom: 1 };
  let grid = [];

  const train = {
    run: false, gx: 1, gy: 1, inPort: 3, progress: 0, speed: 1.55,
    cars: [{ x: 0, y: 0, gx: 1, gy: 1, ang: 0, z: 0 }, { x: 0, y: 0, gx: 1, gy: 1, ang: 0, z: 0 }, { x: 0, y: 0, gx: 1, gy: 1, ang: 0, z: 0 }],
    trail: []
  };

  function makeGrid(n) {
    N = n;
    grid = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ track: null, water: false, prop: null, pop: 1 })));
    // Starter cozy oval + river + bridge so kids can hit START right away!
    const x0 = 1, y0 = 1, x1 = N - 2, y1 = N - 2;
    for (let x = x0 + 1; x < x1; x++) {
      grid[y0][x].track = { type: 'straight', rot: 1 };
      grid[y1][x].track = { type: 'straight', rot: 1 };
    }
    for (let y = y0 + 1; y < y1; y++) {
      grid[y][x0].track = { type: 'straight', rot: 0 };
      grid[y][x1].track = { type: 'straight', rot: 0 };
    }
    grid[y0][x0].track = { type: 'curve', rot: 1 };
    grid[y0][x1].track = { type: 'curve', rot: 2 };
    grid[y1][x1].track = { type: 'curve', rot: 3 };
    grid[y1][x0].track = { type: 'curve', rot: 0 };

    const rx = Math.floor(N * 0.5);
    for (let y = 0; y < N; y++) grid[y][rx].water = true;
    if (N > 4) {
      grid[2][2].prop = { kind: 'house', col: 0 };
      grid[N - 3][N - 3].prop = { kind: 'tree', col: 1 };
    }
    placeTrainOnFirstTrack();
  }

  function getExitPort(track, inPort) {
    if (!track) return null;
    if (track.type === 'straight') {
      const a = track.rot % 2 === 0 ? 0 : 1, b = a + 2;
      return inPort === a ? b : (inPort === b ? a : null);
    }
    if (track.type === 'curve') {
      const a = track.rot, b = (track.rot + 1) % 4;
      return inPort === a ? b : (inPort === b ? a : null);
    }
    if (track.type === 'overpass') {
      return (inPort + 2) % 4;
    }
    return null;
  }

  function placeTrainOnFirstTrack() {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const t = grid[y][x].track;
        if (t) {
          const inP = t.type === 'curve' ? t.rot : (t.rot % 2 === 0 ? 0 : 1);
          Object.assign(train, { gx: x, gy: y, inPort: inP, progress: 0.2, trail: [] });
          stepTrain(0.001);
          return;
        }
      }
    }
  }

  function sproutNeighbors(gx, gy) {
    const dirs = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
    for (const [dx, dy] of dirs) {
      const nx = gx + dx, ny = gy + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const cell = grid[ny][nx];
      if (!cell.track && !cell.water && !cell.prop && Math.random() < 0.34) {
        cell.prop = { kind: Math.random() < 0.55 ? 'house' : 'tree', col: (Math.random() * 4) | 0 };
        cell.pop = 0.05;
      }
    }
  }

  function connectPair(p1, p2) {
    if (p1 === p2) return { type: 'straight', rot: p1 % 2 };
    if ((p1 + 2) % 4 === p2) return { type: 'straight', rot: p1 % 2 === 0 ? 0 : 1 };
    for (let r = 0; r < 4; r++) {
      const a = r, b = (r + 1) % 4;
      if ((p1 === a && p2 === b) || (p1 === b && p2 === a)) return { type: 'curve', rot: r };
    }
    return { type: 'straight', rot: 0 };
  }

  function applyTool(gx, gy, prevCell = null, nextCell = null) {
    if (gx < 0 || gy < 0 || gx >= N || gy >= N) return;
    const cell = grid[gy][gx];
    if (tool === 'erase') {
      cell.track = null; cell.water = false; cell.prop = null;
      tone(220, 0.08, 'triangle', 0.04);
      return;
    }
    if (tool === 'water') {
      cell.water = true; cell.prop = null;
      tone(420, 0.09, 'sine', 0.04);
      return;
    }
    if (tool === 'tree') {
      if (!cell.track && !cell.water) { cell.prop = { kind: 'tree', col: 0 }; cell.pop = 0.1; tone(520, 0.08); }
      return;
    }
    cell.prop = null;
    if (tool === 'auto' && (prevCell || nextCell)) {
      const dirTo = (a, b) => b.gx > a.gx ? 1 : (b.gx < a.gx ? 3 : (b.gy > a.gy ? 2 : 0));
      const p1 = prevCell ? dirTo({ gx, gy }, prevCell) : (dirTo({ gx, gy }, nextCell) + 2) % 4;
      const p2 = nextCell ? dirTo({ gx, gy }, nextCell) : (p1 + 2) % 4;
      cell.track = connectPair(p1, p2);
    } else if (cell.track && !prevCell && !nextCell) {
      cell.track.rot = (cell.track.rot + 1) % 4;
    } else {
      const map = { auto: 'straight', straight: 'straight', curve: 'curve', overpass: 'overpass' };
      cell.track = { type: map[tool] || 'straight', rot: 0 };
    }
    tone(330, 0.07, 'triangle', 0.06);
    sproutNeighbors(gx, gy);
  }

  function screenToGrid(sx, sy) {
    const wx = (sx - W * 0.5 - cam.x) / cam.zoom;
    const wy = (sy - H * 0.5 - cam.y) / cam.zoom;
    if (!iso) {
      const board = N * sz;
      const gx = Math.floor((wx + board * 0.5) / sz);
      const gy = Math.floor((wy + board * 0.5) / sz);
      return (gx >= 0 && gy >= 0 && gx < N && gy < N) ? { gx, gy } : null;
    }
    const tw = 88, th = 44;
    const gx = Math.floor((wx / (tw * 0.5) + wy / (th * 0.5)) * 0.5);
    const gy = Math.floor((wy / (th * 0.5) - wx / (tw * 0.5)) * 0.5);
    return (gx >= 0 && gy >= 0 && gx < N && gy < N) ? { gx, gy } : null;
  }

  // Pointer & Pinch Input
  let pointers = new Map(), dragPath = [], panStart = null, pinchDist = 0;
  c.addEventListener('pointerdown', e => {
    c.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      dragPath = [];
      return;
    }
    const hit = screenToGrid(e.clientX, e.clientY);
    if (hit) {
      dragPath = [hit];
      applyTool(hit.gx, hit.gy);
    } else {
      panStart = { x: e.clientX - cam.x, y: e.clientY - cam.y };
    }
  });

  c.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0) cam.zoom = Math.max(0.55, Math.min(2.1, cam.zoom * (d / pinchDist)));
      pinchDist = d;
      return;
    }
    if (panStart) {
      cam.x = e.clientX - panStart.x;
      cam.y = e.clientY - panStart.y;
      return;
    }
    if (dragPath.length) {
      const hit = screenToGrid(e.clientX, e.clientY);
      const last = dragPath[dragPath.length - 1];
      if (hit && (hit.gx !== last.gx || hit.gy !== last.gy) && Math.abs(hit.gx - last.gx) + Math.abs(hit.gy - last.gy) === 1) {
        dragPath.push(hit);
        const len = dragPath.length;
        if (len >= 2) applyTool(dragPath[len - 2].gx, dragPath[len - 2].gy, dragPath[len - 3] || null, hit);
        applyTool(hit.gx, hit.gy, dragPath[len - 2], null);
      }
    }
  });

  const endPtr = e => { pointers.delete(e.pointerId); if (pointers.size === 0) { dragPath = []; panStart = null; pinchDist = 0; } };
  c.addEventListener('pointerup', endPtr);
  c.addEventListener('pointercancel', endPtr);
  c.addEventListener('wheel', e => { cam.zoom = Math.max(0.55, Math.min(2.1, cam.zoom * (e.deltaY > 0 ? 0.92 : 1.08))); }, { passive: true });

  // UI Controls
  $('btn-view').onclick = () => {
    iso = !iso;
    $('btn-view').textContent = iso ? '2.5D MODEL' : '2D TABLE';
    $('btn-view').classList.toggle('active', !iso);
    tone(580, 0.1);
  };
  $('btn-grid').onclick = () => {
    sizeIdx = (sizeIdx + 1) % SIZES.length;
    $('btn-grid').textContent = `GRID: ${SIZES[sizeIdx]}×${SIZES[sizeIdx]}`;
    makeGrid(SIZES[sizeIdx]);
    tone(440, 0.1);
  };
  $('btn-clear').onclick = () => {
    grid = Array.from({ length: N }, () => Array.from({ length: N }, () => ({ track: null, water: false, prop: null, pop: 1 })));
    train.run = false; $('btn-train').classList.remove('running'); $('train-lbl').textContent = 'START';
    tone(260, 0.12);
  };
  $('btn-zin').onclick = () => { cam.zoom = Math.min(2.1, cam.zoom * 1.15); };
  $('btn-zout').onclick = () => { cam.zoom = Math.max(0.55, cam.zoom * 0.87); };
  $('btn-train').onclick = () => {
    train.run = !train.run;
    if (train.run && !grid[train.gy]?.[train.gx]?.track) placeTrainOnFirstTrack();
    $('btn-train').classList.toggle('running', train.run);
    $('train-lbl').textContent = train.run ? 'STOP' : 'START';
    tone(train.run ? 660 : 330, 0.18, 'triangle', 0.08);
  };
  $('tray').onclick = e => {
    const el = e.target.closest('.tool');
    if (!el) return;
    tool = el.dataset.tool;
    document.querySelectorAll('.tool').forEach(t => t.classList.toggle('sel', t === el));
    tone(480, 0.06);
  };

  function stepTrain(dt) {
    const cell = grid[train.gy]?.[train.gx];
    if (!cell || !cell.track) return;
    let outPort = getExitPort(cell.track, train.inPort);
    if (outPort === null) {
      const anyP = cell.track.type === 'curve' ? cell.track.rot : (cell.track.rot % 2 === 0 ? 0 : 1);
      train.inPort = anyP;
      outPort = getExitPort(cell.track, train.inPort);
    }
    if (train.run) train.progress += train.speed * dt;
    if (train.progress >= 1) {
      train.progress -= 1;
      const d = [[0, -1], [1, 0], [0, 1], [-1, 0]][outPort];
      const nx = train.gx + d[0], ny = train.gy + d[1], nextIn = (outPort + 2) % 4;
      const nextCell = grid[ny]?.[nx];
      if (nextCell && nextCell.track && getExitPort(nextCell.track, nextIn) !== null) {
        train.gx = nx; train.gy = ny; train.inPort = nextIn;
      } else {
        train.inPort = outPort; // Gently reverse at open track ends
      }
      if (train.run) tone(190, 0.04, 'triangle', 0.03);
    }

    const portOff = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]];
    const pA = portOff[train.inPort], pB = portOff[outPort], t = train.progress;
    const gx = train.gx + (1 - t) * (1 - t) * pA[0] + 2 * (1 - t) * t * 0.5 + t * t * pB[0];
    const gy = train.gy + (1 - t) * (1 - t) * pA[1] + 2 * (1 - t) * t * 0.5 + t * t * pB[1];
    const elev = (cell.track.type === 'overpass' && (train.inPort === 1 || train.inPort === 3)) ? 1 : (cell.water ? 0.5 : 0);

    const head = { gx, gy, x: gx * sz, y: gy * sz, z: elev, ang: Math.atan2(pB[1] - pA[1], pB[0] - pA[0]) };
    if (train.run || train.trail.length === 0) {
      train.trail.unshift(head);
      if (train.trail.length > 60) train.trail.pop();
    }
    train.cars[0] = train.trail[0] || head;
    train.cars[1] = train.trail[Math.min(14, train.trail.length - 1)] || head;
    train.cars[2] = train.trail[Math.min(28, train.trail.length - 1)] || head;
  }

  makeGrid(N);
  let last = performance.now();
  function loop(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now; time += dt;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (grid[y][x].pop < 1) grid[y][x].pop = Math.min(1, grid[y][x].pop + dt * 4);
    stepTrain(dt);
    if (window.TracksRender) window.TracksRender.render(ctx, { W, H, cam, iso, grid, N, sz, train, time });
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
