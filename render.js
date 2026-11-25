window.FlybyRender = (() => {
  const C = Math.SQRT1_2; // cos(45°) = sin(45°)
  const TILT = 0.56;      // Isometric vertical foreshortening

  function iso(x, y, z = 0) {
    return { x: (x - y) * C, y: (x + y) * C * TILT - z };
  }

  function isoAngle(ang) {
    const vx = Math.cos(ang), vy = Math.sin(ang);
    return Math.atan2((vx + vy) * TILT, vx - vy);
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function drawDetailedPigeon(ctx, x, y, ang, bird, scale, time) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(scale, (1 - Math.abs(bird.bank) * 0.22) * scale);

    if (bird.pwr) {
      const aura = bird.pwr === 'RAPID' ? '#ef4444' : (bird.pwr === 'TRIPLE' ? '#38bdf8' : '#fde047');
      ctx.strokeStyle = aura;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, 30 + Math.sin(time * 10) * 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (bird.alt === 'LOW') {
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 1.6;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-4, side * 3.5); ctx.lineTo(-9, side * 5.2);
        ctx.moveTo(-9, side * 5.2); ctx.lineTo(-11.5, side * 6.5);
        ctx.moveTo(-9, side * 5.2); ctx.lineTo(-11.5, side * 3.8);
        ctx.stroke();
      }
    }

    const rs = Math.sin(bird.wing);
    const stroke = rs >= 0 ? Math.pow(rs, 0.72) : -Math.pow(-rs, 1.35);
    const sweep = Math.cos(bird.wing);
    const lightShift = Math.round(stroke * 18);

    for (const side of [-1, 1]) {
      const bankMod = 1 + side * bird.bank * 0.18;
      const span = (31 + stroke * 13) * bankMod;
      const wx = 3.5 + stroke * 4.8 + sweep * 2.4;
      const wy = side * (span * 0.56);
      const tx = -11.5 + stroke * 8 - sweep * 4.8;
      const ty = side * span;

      for (let f = 0; f < 8; f++) {
        const t = f / 7;
        const fx = wx + (tx - wx) * (0.42 + t * 0.64) - t * 5.8;
        const fy = wy + (ty - wy) * (0.40 + t * 0.64);
        const bx = wx - 4.2 - t * 5.2;
        const by = wy * 0.64;

        ctx.fillStyle = f % 2 === 0 ? '#64748b' : '#475569';
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo((bx + fx) * 0.5 + 2.2, (by + fy) * 0.5 + side * 2.2, fx, fy);
        ctx.lineTo(fx - 3.2, fy - side * 2.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(fx - 1.1, fy - side * 1.1, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }

      const c1 = 203 + lightShift, c2 = 148 + lightShift;
      const wg = ctx.createLinearGradient(7, 0, -10, side * span * 0.8);
      wg.addColorStop(0, `rgb(${Math.min(245, c1)}, ${Math.min(250, c1 + 8)}, ${Math.min(255, c1 + 18)})`);
      wg.addColorStop(0.65, `rgb(${c2}, ${c2 + 12}, ${c2 + 24})`);
      wg.addColorStop(1, '#64748b');

      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(7.5, side * 3);
      ctx.quadraticCurveTo(wx + 5.5, wy * 0.65, wx, wy);
      ctx.quadraticCurveTo((wx + tx) * 0.5 + 2, (wy + ty) * 0.5 + side * 2, tx, ty);
      ctx.quadraticCurveTo(-8.5, side * span * 0.45, -11.5, side * 4);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0f172a';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-0.5, side * 6); ctx.quadraticCurveTo(wx - 2.8, wy * 0.68, -4, wy * 0.89);
      ctx.stroke();

      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(-5, side * 5.2); ctx.quadraticCurveTo(wx - 6, wy * 0.56, -8.2, wy * 0.74);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(6, side * 3.8); ctx.quadraticCurveTo(wx + 3, wy * 0.62, wx, wy);
      ctx.stroke();
    }

    const ta = 0.22 + bird.tail * 0.44, tLen = 24;
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-tLen, -Math.sin(ta) * tLen);
    ctx.quadraticCurveTo(-tLen - 3, 0, -tLen, Math.sin(ta) * tLen);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-11, -2.5); ctx.lineTo(-tLen + 1, -Math.sin(ta) * (tLen - 1));
    ctx.moveTo(-11, 2.5); ctx.lineTo(-tLen + 1, Math.sin(ta) * (tLen - 1));
    ctx.stroke();

    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(-tLen + 3.5, -Math.sin(ta) * (tLen - 3.5));
    ctx.quadraticCurveTo(-tLen + 0.8, 0, -tLen + 3.5, Math.sin(ta) * (tLen - 3.5));
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.ellipse(-9.2, 0, 5.8, 4.6, 0, 0, Math.PI * 2); ctx.fill();

    const bg = ctx.createLinearGradient(-12, 0, 14, 0);
    bg.addColorStop(0, '#94a3b8'); bg.addColorStop(0.55, '#e2e8f0'); bg.addColorStop(1, '#64748b');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 8.4, 0, 0, Math.PI * 2); ctx.fill();

    const shimmer = 0.5 + 0.5 * Math.sin(bird.ang * 2 + time * 3);
    const ng = ctx.createLinearGradient(5, -6, 12, 6);
    ng.addColorStop(0, shimmer > 0.5 ? '#10b981' : '#34d399');
    ng.addColorStop(0.5, shimmer > 0.5 ? '#c084fc' : '#a855f7');
    ng.addColorStop(1, '#059669');
    ctx.fillStyle = ng;
    ctx.beginPath(); ctx.ellipse(8.8, 0, 5.6, 6.6, 0, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.beginPath(); ctx.arc(13.8, 0, 5.3, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.beginPath(); ctx.arc(14.8, -3.5, 1.6, 0, Math.PI * 2); ctx.arc(14.8, 3.5, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.arc(15.2, -3.5, 0.75, 0, Math.PI * 2); ctx.arc(15.2, 3.5, 0.75, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.moveTo(18.2, -2.2); ctx.lineTo(24.5, 0); ctx.lineTo(18.2, 2.2); ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.ellipse(18.5, 0, 1.5, 2.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function drawHazardSprite(ctx, x, y, ang, h, birdAlt, time) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.globalAlpha = birdAlt === 'LOW' ? 0.34 : 1.0;

    if (h.tp === 'HELI') {
      ctx.fillStyle = '#dc2626'; rr(ctx, -22, -11, 36, 22, 8); ctx.fill();
      ctx.fillStyle = '#991b1b'; ctx.fillRect(-40, -3, 20, 6);
      ctx.fillStyle = '#bae6fd'; rr(ctx, 4, -8, 10, 16, 4); ctx.fill();
      if (Math.sin(time * 12) > 0) {
        ctx.fillStyle = '#f87171';
        ctx.beginPath(); ctx.arc(-38, 0, 4, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
      ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.72)'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(Math.cos(h.ph) * 34, Math.sin(h.ph) * 34); ctx.lineTo(-Math.cos(h.ph) * 34, -Math.sin(h.ph) * 34);
      ctx.moveTo(Math.cos(h.ph + 1.57) * 34, Math.sin(h.ph + 1.57) * 34); ctx.lineTo(-Math.cos(h.ph + 1.57) * 34, -Math.sin(h.ph + 1.57) * 34);
      ctx.stroke();
    } else if (h.tp === 'DRONE') {
      ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-14, -14); ctx.lineTo(14, 14); ctx.moveTo(14, -14); ctx.lineTo(-14, 14); ctx.stroke();
      ctx.fillStyle = '#d97706'; rr(ctx, -6, -6, 12, 12, 2); ctx.fill();
      for (const [rx, ry] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) {
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath(); ctx.arc(rx, ry, 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    } else {
      const fl = Math.sin(h.ph * 0.42) * 9;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(7, 0); ctx.quadraticCurveTo(-4, -28 - fl, -13, -19); ctx.lineTo(-9, 0);
      ctx.quadraticCurveTo(-4, 28 + fl, -13, 19); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.beginPath(); ctx.ellipse(0, 0, 15, 6.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.moveTo(14, -2); ctx.lineTo(20, 0); ctx.lineTo(14, 2); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  // --- 3D ISOMETRIC BUILDING HELPER ---
  function drawIsoBuilding(ctx, rx, ry, sub, rs, bh, time, fade) {
    const palettes = [
      { roof: '#cbd5e1', left: '#94a3b8', right: '#64748b' },
      { roof: '#b45309', left: '#92400e', right: '#78350f' },
      { roof: '#475569', left: '#334155', right: '#1e293b' },
      { roof: '#9a3412', left: '#7c2d12', right: '#5c1f0e' },
      { roof: '#64748b', left: '#475569', right: '#334155' },
      { roof: '#7c2d12', left: '#5c210e', right: '#451a03' }
    ];
    const pal = palettes[Math.floor(rs * palettes.length)];

    const T = iso(rx, ry, 0);
    const R = iso(rx + sub, ry, 0);
    const B = iso(rx + sub, ry + sub, 0);
    const L = iso(rx, ry + sub, 0);

    ctx.save();
    if (fade) ctx.globalAlpha = 0.48;

    // Ground cast shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.moveTo(R.x, R.y);
    ctx.lineTo(R.x + bh * 0.42, R.y + bh * 0.16);
    ctx.lineTo(B.x + bh * 0.42, B.y + bh * 0.16);
    ctx.lineTo(B.x, B.y);
    ctx.closePath();
    ctx.fill();

    // Left front wall (L -> B)
    ctx.fillStyle = pal.left;
    ctx.beginPath();
    ctx.moveTo(L.x, L.y); ctx.lineTo(B.x, B.y);
    ctx.lineTo(B.x, B.y - bh); ctx.lineTo(L.x, L.y - bh);
    ctx.closePath();
    ctx.fill();

    // Right front wall (B -> R)
    ctx.fillStyle = pal.right;
    ctx.beginPath();
    ctx.moveTo(B.x, B.y); ctx.lineTo(R.x, R.y);
    ctx.lineTo(R.x, R.y - bh); ctx.lineTo(B.x, B.y - bh);
    ctx.closePath();
    ctx.fill();

    // Windows on both front walls
    const floors = Math.max(2, Math.floor(bh / 22));
    const cols = 4;
    for (let fl = 0; fl < floors; fl++) {
      const z0 = 10 + fl * ((bh - 16) / floors);
      const wh = 8;
      for (let col = 0; col < cols; col++) {
        const u0 = (col + 0.22) / cols, u1 = (col + 0.72) / cols;
        const lit = ((fl * 7 + col * 13 + Math.floor(rs * 99)) % 5) === 0;
        ctx.fillStyle = lit ? 'rgba(254, 240, 138, 0.72)' : 'rgba(15, 23, 42, 0.36)';

        // Left wall window
        const lx0 = L.x + (B.x - L.x) * u0, ly0 = L.y + (B.y - L.y) * u0 - z0;
        const lx1 = L.x + (B.x - L.x) * u1, ly1 = L.y + (B.y - L.y) * u1 - z0;
        ctx.beginPath();
        ctx.moveTo(lx0, ly0); ctx.lineTo(lx1, ly1);
        ctx.lineTo(lx1, ly1 - wh); ctx.lineTo(lx0, ly0 - wh);
        ctx.closePath(); ctx.fill();

        // Right wall window
        const rx0 = B.x + (R.x - B.x) * u0, ry0 = B.y + (R.y - B.y) * u0 - z0;
        const rx1 = B.x + (R.x - B.x) * u1, ry1 = B.y + (R.y - B.y) * u1 - z0;
        ctx.beginPath();
        ctx.moveTo(rx0, ry0); ctx.lineTo(rx1, ry1);
        ctx.lineTo(rx1, ry1 - wh); ctx.lineTo(rx0, ry0 - wh);
        ctx.closePath(); ctx.fill();
      }
    }

    // Roof diamond
    ctx.fillStyle = pal.roof;
    ctx.beginPath();
    ctx.moveTo(T.x, T.y - bh); ctx.lineTo(R.x, R.y - bh);
    ctx.lineTo(B.x, B.y - bh); ctx.lineTo(L.x, L.y - bh);
    ctx.closePath();
    ctx.fill();

    // Parapet trim
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Elevated rooftop detail
    const rc = iso(rx + sub * 0.5, ry + sub * 0.5, bh);
    if (rs < 0.33) {
      // Spinning HVAC unit
      ctx.fillStyle = '#475569';
      ctx.fillRect(rc.x - 14, rc.y - 10, 28, 18);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath(); ctx.ellipse(rc.x, rc.y - 1, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 1.6;
      const fa = time * 4 + rs * 10;
      ctx.beginPath();
      ctx.moveTo(rc.x + Math.cos(fa) * 7, rc.y - 1 + Math.sin(fa) * 4);
      ctx.lineTo(rc.x - Math.cos(fa) * 7, rc.y - 1 - Math.sin(fa) * 4);
      ctx.stroke();
    } else if (rs < 0.62) {
      // Glass skylight
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.moveTo(rc.x, rc.y - 12); ctx.lineTo(rc.x + 22, rc.y);
      ctx.lineTo(rc.x, rc.y + 12); ctx.lineTo(rc.x - 22, rc.y);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 1.4; ctx.stroke();
    } else if (rs < 0.82) {
      // Solar panels
      ctx.fillStyle = '#1e3a8a';
      ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1;
      for (let p = -1; p <= 1; p++) {
        ctx.fillRect(rc.x + p * 18 - 7, rc.y - 9, 14, 18);
        ctx.strokeRect(rc.x + p * 18 - 7, rc.y - 9, 14, 18);
      }
    } else {
      // Classic NYC Water Tower
      ctx.strokeStyle = '#451a03'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(rc.x - 8, rc.y + 4); ctx.lineTo(rc.x - 5, rc.y - 8);
      ctx.moveTo(rc.x + 8, rc.y + 4); ctx.lineTo(rc.x + 5, rc.y - 8);
      ctx.stroke();
      ctx.fillStyle = '#92400e';
      ctx.fillRect(rc.x - 10, rc.y - 22, 20, 15);
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(rc.x - 12, rc.y - 22); ctx.lineTo(rc.x, rc.y - 31); ctx.lineTo(rc.x + 12, rc.y - 22);
      ctx.closePath(); ctx.fill();
    }

    ctx.restore();
  }

  // --- 3D ISOMETRIC CAR HELPER ---
  function drawIsoCar(ctx, car) {
    const hw = car.w * 0.5, hh = car.h * 0.5;
    const cos = Math.cos(car.ang), sin = Math.sin(car.ang);
    const pt = (lx, ly, z) => iso(car.x + lx * cos - ly * sin, car.y + lx * sin + ly * cos, z);

    const hBody = car.van ? 15 : 10;
    const p0 = pt(hw, -hh, 0), p1 = pt(hw, hh, 0), p2 = pt(-hw, hh, 0), p3 = pt(-hw, -hh, 0);
    const t0 = pt(hw, -hh, hBody), t1 = pt(hw, hh, hBody), t2 = pt(-hw, hh, hBody), t3 = pt(-hw, -hh, hBody);

    // Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.beginPath();
    ctx.moveTo(p0.x + 4, p0.y + 4); ctx.lineTo(p1.x + 4, p1.y + 4);
    ctx.lineTo(p2.x + 4, p2.y + 4); ctx.lineTo(p3.x + 4, p3.y + 4);
    ctx.closePath(); ctx.fill();

    // Headlight beam
    const hl1 = pt(hw + 20, -hh - 4, 2), hl2 = pt(hw + 20, hh + 4, 2);
    ctx.fillStyle = 'rgba(254, 240, 138, 0.14)';
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y); ctx.lineTo(hl1.x, hl1.y); ctx.lineTo(hl2.x, hl2.y); ctx.lineTo(p1.x, p1.y);
    ctx.closePath(); ctx.fill();

    // Extruded sides (draw all 4 sides simply—painter's order with top cap covers back)
    const sides = [[p0, p1, t1, t0], [p1, p2, t2, t1], [p2, p3, t3, t2], [p3, p0, t0, t3]];
    ctx.fillStyle = car.col;
    for (const [a, b, c2, d] of sides) {
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(d.x, d.y); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.fill();
      ctx.fillStyle = car.col;
    }

    // Top hood/deck
    ctx.fillStyle = car.col;
    ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y); ctx.lineTo(t2.x, t2.y); ctx.lineTo(t3.x, t3.y); ctx.closePath();
    ctx.fill();

    // Windshield
    const w0 = pt(hw - 7, -hh + 3, hBody + 1), w1 = pt(hw - 7, hh - 3, hBody + 1);
    const w2 = pt(hw - 16, hh - 3, hBody + 1), w3 = pt(hw - 16, -hh + 3, hBody + 1);
    ctx.fillStyle = '#0f172a';
    ctx.beginPath(); ctx.moveTo(w0.x, w0.y); ctx.lineTo(w1.x, w1.y); ctx.lineTo(w2.x, w2.y); ctx.lineTo(w3.x, w3.y); ctx.closePath();
    ctx.fill();

    if (car.conv) {
      const i0 = pt(2, -hh + 4, hBody + 1), i1 = pt(2, hh - 4, hBody + 1);
      const i2 = pt(-13, hh - 4, hBody + 1), i3 = pt(-13, -hh + 4, hBody + 1);
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath(); ctx.moveTo(i0.x, i0.y); ctx.lineTo(i1.x, i1.y); ctx.lineTo(i2.x, i2.y); ctx.lineTo(i3.x, i3.y); ctx.closePath();
      ctx.fill();
      const drv = pt(-3, -3, hBody + 4);
      ctx.fillStyle = '#475569';
      ctx.beginPath(); ctx.arc(drv.x, drv.y, 3.2, 0, Math.PI * 2); ctx.fill();
    } else if (!car.van) {
      // Raised sedan cabin
      const c0 = pt(2, -hh + 3, hBody + 6), c1 = pt(2, hh - 3, hBody + 6);
      const c2 = pt(-14, hh - 3, hBody + 6), c3 = pt(-14, -hh + 3, hBody + 6);
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath(); ctx.moveTo(c0.x, c0.y); ctx.lineTo(c1.x, c1.y); ctx.lineTo(c2.x, c2.y); ctx.lineTo(c3.x, c3.y); ctx.closePath();
      ctx.fill();
      if (car.taxi) {
        const tx = pt(-5, 0, hBody + 8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(tx.x - 4, tx.y - 3, 8, 5);
        ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.strokeRect(tx.x - 4, tx.y - 3, 8, 5);
      }
    }
  }

  // --- ISOMETRIC 2.5D RENDERER ---
  function renderIso(ctx, s) {
    const { W, H, zoom, mode, time, bird, cars, peds, gpigs, drops, splats, pops, particles, haz, winds, perches, clouds, joy, shake, CELL, ROAD, hash, flightParams } = s;

    ctx.clearRect(0, 0, W, H);
    const vW = W / zoom, vH = H / zoom;
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 12 : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 12 : 0;

    const focus = iso(bird.x + Math.cos(bird.ang) * 44, bird.y + Math.sin(bird.ang) * 44, 0);
    const camX = focus.x - vW / 2 + shakeX;
    const camY = focus.y - vH / 2 + shakeY;

    // Inverse-project 4 viewport corners to find visible grid cells
    const corners = [[camX, camY], [camX + vW, camY], [camX, camY + vH], [camX + vW, camY + vH]];
    let minWX = Infinity, maxWX = -Infinity, minWY = Infinity, maxWY = -Infinity;
    for (const [px, py] of corners) {
      const u = px / C, v = py / (C * TILT);
      const wx = (u + v) * 0.5, wy = (v - u) * 0.5;
      if (wx < minWX) minWX = wx; if (wx > maxWX) maxWX = wx;
      if (wy < minWY) minWY = wy; if (wy > maxWY) maxWY = wy;
    }
    const gx0 = Math.floor(minWX / CELL) - 1, gx1 = Math.floor(maxWX / CELL) + 1;
    const gy0 = Math.floor(minWY / CELL) - 1, gy1 = Math.floor(maxWY / CELL) + 1;

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    // 1. Flat Ground Plane (Projected cleanly with a single isometric matrix!)
    ctx.save();
    ctx.scale(1, TILT);
    ctx.rotate(Math.PI / 4);

    ctx.fillStyle = '#2d3748';
    ctx.fillRect(gx0 * CELL, gy0 * CELL, (gx1 - gx0 + 1) * CELL, (gy1 - gy0 + 1) * CELL);

    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        const bx = gx * CELL, by = gy * CELL;
        const pad = ROAD / 2, ins = CELL - ROAD;

        // Road lines
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.52)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([18, 16]);
        ctx.beginPath();
        ctx.moveTo(bx + pad + 18, by); ctx.lineTo(bx + CELL - pad - 18, by);
        ctx.moveTo(bx, by + pad + 18); ctx.lineTo(bx, by + CELL - pad - 18);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosswalks & Manhole
        ctx.fillStyle = 'rgba(248, 250, 252, 0.42)';
        for (let k = -36; k <= 36; k += 14) {
          ctx.fillRect(bx + pad + 6, by + k - 3.5, 16, 7);
          ctx.fillRect(bx - pad - 22, by + k - 3.5, 16, 7);
          ctx.fillRect(bx + k - 3.5, by + pad + 6, 7, 16);
          ctx.fillRect(bx + k - 3.5, by - pad - 22, 7, 16);
        }
        ctx.fillStyle = '#1e293b';
        ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.stroke();

        // Sidewalk
        ctx.fillStyle = '#94a3b8';
        rr(ctx, bx + pad, by + pad, ins, ins, 20); ctx.fill();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; ctx.stroke();

        if (hash(gx, gy) >= 0.72) {
          // Park lawn, paths & fountain
          const inset = pad + 18, bs = ins - 36;
          ctx.fillStyle = '#4ade80';
          rr(ctx, bx + inset, by + inset, bs, bs, 16); ctx.fill();
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 18;
          ctx.beginPath();
          ctx.moveTo(bx + inset + 16, by + inset + bs / 2); ctx.lineTo(bx + inset + bs - 16, by + inset + bs / 2);
          ctx.moveTo(bx + inset + bs / 2, by + inset + 16); ctx.lineTo(bx + inset + bs / 2, by + inset + bs - 16);
          ctx.stroke();
          ctx.fillStyle = '#92400e';
          ctx.fillRect(bx + inset + 60, by + inset + bs / 2 - 18, 24, 7);
          ctx.fillRect(bx + inset + bs - 84, by + inset + bs / 2 + 11, 24, 7);

          const fx = bx + inset + bs / 2, fy = by + inset + bs / 2;
          ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(fx, fy, 32, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.arc(fx, fy, 25, 0, Math.PI * 2); ctx.fill();
          const rip = (time * 18) % 20;
          ctx.strokeStyle = `rgba(224, 242, 254, ${1 - rip / 20})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(fx, fy, 4 + rip, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }

    // Ground splats (non-car)
    for (const sp of splats) {
      if (sp.car) continue;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.arc(sp.x + sp.r * 0.65, sp.y - sp.r * 0.35, sp.r * 0.52, 0, Math.PI * 2);
      ctx.arc(sp.x - sp.r * 0.55, sp.y + sp.r * 0.45, sp.r * 0.44, 0, Math.PI * 2);
      ctx.fill();
    }

    // Predictive Aim Reticle on ground plane
    let predX = bird.x, predY = bird.y;
    if (mode === 'PLAY') {
      const a = flightParams();
      predX = bird.x + a.vx * a.dur; predY = bird.y + a.vy * a.dur;
      const rad = bird.pwr === 'MEGA' ? 28 : 16;
      ctx.save(); ctx.translate(predX, predY);
      ctx.strokeStyle = bird.cd <= 0 ? 'rgba(56, 189, 248, 0.95)' : 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 2.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(0, 0, rad + Math.sin(time * 8) * 1.5, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = bird.cd <= 0 ? '#38bdf8' : '#94a3b8';
      ctx.beginPath(); ctx.arc(0, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    ctx.restore(); // End flat ground transform

    // 2. Collect 3D World Objects & Depth-Sort (Back to Front by x + y)
    const drawList = [];
    const birdScreen = iso(bird.x, bird.y, 0);
    const predScreen = iso(predX, predY, 0);

    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        const bx = gx * CELL, by = gy * CELL;
        const pad = ROAD / 2, ins = CELL - ROAD, inset = pad + 18, bs = ins - 36;

        if (hash(gx, gy) < 0.72) {
          const sub = bs / 2 - 8;
          for (let sx = 0; sx < 2; sx++) {
            for (let sy = 0; sy < 2; sy++) {
              const rx = bx + inset + sx * (sub + 16);
              const ry = by + inset + sy * (sub + 16);
              const rs = hash(gx * 2 + sx, gy * 2 + sy);
              const bh = 46 + Math.floor(rs * 62);
              const cx = rx + sub * 0.5, cy = ry + sub * 0.5;
              const depth = cx + cy;

              // Smart fade if building sits in front of bird ground shadow or reticle
              const bc = iso(cx, cy, bh * 0.4);
              const fadeBird = (bird.x + bird.y < depth) && Math.hypot(birdScreen.x - bc.x, birdScreen.y - bc.y) < 110;
              const fadePred = mode === 'PLAY' && (predX + predY < depth) && Math.hypot(predScreen.x - bc.x, predScreen.y - bc.y) < 105;

              drawList.push({
                depth,
                fn: () => drawIsoBuilding(ctx, rx, ry, sub, rs, bh, time, fadeBird || fadePred)
              });
            }
          }
        } else {
          // 3D Park Trees
          for (let t = 0; t < 4; t++) {
            const tx = bx + inset + (t % 2 === 0 ? 52 : bs - 52);
            const ty = by + inset + (t < 2 ? 52 : bs - 52);
            drawList.push({
              depth: tx + ty,
              fn: () => {
                const g = iso(tx, ty, 0), top = iso(tx, ty, 24);
                ctx.fillStyle = 'rgba(15, 23, 42, 0.24)';
                ctx.beginPath(); ctx.ellipse(g.x + 8, g.y + 4, 22, 13, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#78350f'; ctx.lineWidth = 6;
                ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(top.x, top.y + 6); ctx.stroke();
                ctx.fillStyle = '#15803d';
                ctx.beginPath(); ctx.arc(top.x, top.y, 22, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#22c55e';
                ctx.beginPath(); ctx.arc(top.x - 4, top.y - 5, 14, 0, Math.PI * 2); ctx.fill();
              }
            });
          }
        }
      }
    }

    // Perch Power-Ups (3D Berry Trees & Utility Nest Poles)
    for (const p of perches) {
      if (!p.act) continue;
      drawList.push({
        depth: p.x + p.y,
        fn: () => {
          const acc = p.rew === 'RAPID' ? '#ef4444' : (p.rew === 'TRIPLE' ? '#38bdf8' : '#f59e0b');
          const g = iso(p.x, p.y, 0), top = iso(p.x, p.y, p.kind === 'TREE' ? 28 : 38);
          const glowR = 24 + Math.sin(p.pulse) * 4;

          ctx.save();
          ctx.strokeStyle = bird.alt === 'LOW' ? '#fde047' : 'rgba(255,255,255,0.5)';
          ctx.lineWidth = bird.alt === 'LOW' ? 2.8 : 1.5;
          ctx.setLineDash([6, 4]);
          ctx.beginPath(); ctx.ellipse(g.x, g.y, glowR, glowR * TILT, 0, 0, Math.PI * 2); ctx.stroke();
          ctx.setLineDash([]);

          if (p.kind === 'TREE') {
            ctx.strokeStyle = '#78350f'; ctx.lineWidth = 7;
            ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(top.x, top.y + 8); ctx.stroke();
            ctx.fillStyle = '#15803d'; ctx.beginPath(); ctx.arc(top.x, top.y, 23, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#16a34a'; ctx.beginPath(); ctx.arc(top.x - 4, top.y - 5, 15, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = acc;
            for (let b = 0; b < 7; b++) {
              const ba = (b / 7) * Math.PI * 2 + p.pulse * 0.12;
              ctx.beginPath(); ctx.arc(top.x + Math.cos(ba) * 11, top.y + Math.sin(ba) * 9, 4, 0, Math.PI * 2); ctx.fill();
            }
          } else {
            ctx.strokeStyle = '#64748b'; ctx.lineWidth = 5;
            ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(top.x, top.y); ctx.stroke();
            ctx.lineWidth = 4;
            ctx.beginPath(); ctx.moveTo(top.x - 16, top.y + 4); ctx.lineTo(top.x + 16, top.y + 4); ctx.stroke();
            ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.ellipse(top.x, top.y, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#b45309'; ctx.beginPath(); ctx.ellipse(top.x, top.y - 1, 9, 5.5, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(top.x, top.y - 3, 5.5, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
      });
    }

    // 3D Cars
    for (const car of cars) {
      drawList.push({ depth: car.x + car.y, fn: () => drawIsoCar(ctx, car) });
    }

    // 3D Pedestrians
    for (const p of peds) {
      drawList.push({
        depth: p.x + p.y,
        fn: () => {
          const g = iso(p.x, p.y, 0);
          const bob = Math.abs(Math.sin(p.ph)) * 2;
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.beginPath(); ctx.ellipse(g.x + 2, g.y + 2, 6, 3.5, 0, 0, Math.PI * 2); ctx.fill();
          // Torso
          ctx.fillStyle = p.col;
          ctx.beginPath(); ctx.roundRect ? ctx.roundRect(g.x - 4, g.y - 11 - bob, 8, 9, 3) : ctx.rect(g.x - 4, g.y - 11 - bob, 8, 9); ctx.fill();
          // Head
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath(); ctx.arc(g.x, g.y - 14 - bob, 3.8, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = p.hair;
          ctx.beginPath(); ctx.arc(g.x, g.y - 15.5 - bob, 3.2, Math.PI, 0); ctx.fill();
          if (p.umb) {
            ctx.fillStyle = p.col;
            ctx.beginPath(); ctx.arc(g.x, g.y - 18 - bob, 10, Math.PI, 0); ctx.closePath(); ctx.fill();
          }
        }
      });
    }

    // Ambient Sidewalk Pigeons
    for (const g of gpigs) {
      drawList.push({
        depth: g.x + g.y,
        fn: () => {
          const pt = iso(g.x, g.y, g.sc ? 16 : 2);
          ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(isoAngle(g.ang));
          if (g.sc) {
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 8 + Math.sin(g.ph * 2.8) * 7, 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.ellipse(0, 0, 5, 3.2, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(4.5, 0, 2.2, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      });
    }

    drawList.sort((a, b) => a.depth - b.depth);
    for (const item of drawList) item.fn();

    // Car-attached splats (elevated on vehicle roofs)
    for (const sp of splats) {
      if (!sp.car) continue;
      const p = iso(sp.x, sp.y, 13);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.beginPath(); ctx.ellipse(p.x, p.y, sp.r * 0.85, sp.r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }

    // 3. Falling Drops (3D arc from bird.z down to z=0)
    for (const d of drops) {
      const pr = Math.min(1, d.el / d.dur);
      const startZ = d.startZ || 110;
      const curZ = (1 - pr * pr) * startZ;
      const g = iso(d.x, d.y, 0), p = iso(d.x, d.y, curZ);
      const sc = 1.15 - pr * 0.45;

      ctx.fillStyle = `rgba(15, 23, 42, ${0.16 + pr * 0.3})`;
      ctx.beginPath(); ctx.ellipse(g.x, g.y, (d.mega ? 18 : 9) * (1 - pr * 0.3), (d.mega ? 10 : 5) * (1 - pr * 0.3), 0, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = d.mega ? '#fef08a' : '#ffffff';
      ctx.beginPath(); ctx.arc(p.x, p.y, 6.5 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.3; ctx.stroke();
    }

    // 4. Particles
    for (const pt of particles) {
      const p = iso(pt.x, pt.y, pt.z || 6);
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.translate(p.x, p.y); ctx.rotate(pt.ang);
      ctx.fillStyle = pt.col;
      if (pt.kind === 'feather') {
        ctx.beginPath(); ctx.ellipse(0, 0, pt.sz * 1.8, pt.sz * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, pt.sz, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // 5. Wind Gust Zones (Elevated airspace ribbons)
    for (const w of winds) {
      const p = iso(w.x, w.y, 70);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(isoAngle(w.ang));
      ctx.fillStyle = 'rgba(186, 230, 253, 0.1)';
      ctx.beginPath(); ctx.ellipse(0, 0, w.r * 0.9, w.r * 0.58, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.5)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      for (let k = -2; k <= 2; k++) {
        const off = ((w.ph * 36 + k * 48) % 160) - 80;
        ctx.beginPath(); ctx.moveTo(off - 20, k * 24); ctx.lineTo(off + 20, k * 24); ctx.stroke();
      }
      ctx.restore();
    }

    // 6. Aerial Hazards (High airspace z=120 + ground shadow)
    for (const h of haz) {
      const g = iso(h.x, h.y, 0), p = iso(h.x, h.y, 120);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.beginPath(); ctx.ellipse(g.x, g.y, h.r * 0.9, h.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      drawHazardSprite(ctx, p.x, p.y, isoAngle(h.ang), h, bird.alt, time);
    }

    // 7. Player City Pigeon (Ground shadow + Plumb line + Elevated body)
    const bg = iso(bird.x, bird.y, 0);
    const bp = iso(bird.x, bird.y, bird.z);
    const bAng = isoAngle(bird.ang);

    // Shadow directly below pigeon
    ctx.save();
    ctx.translate(bg.x, bg.y); ctx.rotate(bAng); ctx.scale(0.62, 0.42);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 6.5, 0, 0, Math.PI * 2);
    ctx.ellipse(-2, 0, 6.5, 19 + Math.sin(bird.wing) * 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Subtle vertical altitude plumb line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(bp.x, bp.y + 8); ctx.lineTo(bg.x, bg.y); ctx.stroke();
    ctx.setLineDash([]);

    drawDetailedPigeon(ctx, bp.x, bp.y, bAng, bird, bird.alt === 'HIGH' ? 1.12 : 0.94, time);

    // 8. High-Altitude Clouds
    for (const cl of clouds) {
      const p = iso(cl.x, cl.y, 175);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, cl.r, 0, Math.PI * 2);
      ctx.arc(p.x + cl.r * 0.65, p.y - cl.r * 0.18, cl.r * 0.72, 0, Math.PI * 2);
      ctx.arc(p.x - cl.r * 0.6, p.y + cl.r * 0.12, cl.r * 0.68, 0, Math.PI * 2);
      ctx.fill();
    }

    // 9. Floating Score Popups
    ctx.font = '900 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    for (const pop of pops) {
      const p = iso(pop.x, pop.y, 38);
      ctx.globalAlpha = Math.min(1, pop.life * 1.4);
      ctx.fillStyle = '#0f172a'; ctx.fillText(pop.txt, p.x + 1.2, p.y + 1.2);
      ctx.fillStyle = pop.col; ctx.fillText(pop.txt, p.x, p.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 10. Virtual Joystick Overlay
    if (joy.act) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 50, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.68)';
      ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 50, joy.oy + joy.dy * 50, 21, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // --- CLASSIC 2D TOP-DOWN RENDERER ---
  function renderTop(ctx, s) {
    const { W, H, zoom, mode, time, bird, cars, peds, gpigs, drops, splats, pops, particles, haz, winds, perches, clouds, joy, shake, CELL, ROAD, hash, flightParams } = s;

    ctx.clearRect(0, 0, W, H);
    const vW = W / zoom, vH = H / zoom;
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 12 : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 12 : 0;
    const camX = bird.x + Math.cos(bird.ang) * 44 - vW / 2 + shakeX;
    const camY = bird.y + Math.sin(bird.ang) * 44 - vH / 2 + shakeY;

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    const gx0 = Math.floor(camX / CELL) - 1, gx1 = Math.floor((camX + vW) / CELL) + 1;
    const gy0 = Math.floor(camY / CELL) - 1, gy1 = Math.floor((camY + vH) / CELL) + 1;

    ctx.fillStyle = '#2d3748';
    ctx.fillRect(gx0 * CELL, gy0 * CELL, (gx1 - gx0 + 1) * CELL, (gy1 - gy0 + 1) * CELL);

    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        const bx = gx * CELL, by = gy * CELL, pad = ROAD / 2, ins = CELL - ROAD;

        ctx.strokeStyle = 'rgba(250, 204, 21, 0.52)'; ctx.lineWidth = 2.5; ctx.setLineDash([18, 16]);
        ctx.beginPath();
        ctx.moveTo(bx + pad + 18, by); ctx.lineTo(bx + CELL - pad - 18, by);
        ctx.moveTo(bx, by + pad + 18); ctx.lineTo(bx, by + CELL - pad - 18);
        ctx.stroke(); ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(248, 250, 252, 0.42)';
        for (let k = -36; k <= 36; k += 14) {
          ctx.fillRect(bx + pad + 6, by + k - 3.5, 16, 7);
          ctx.fillRect(bx - pad - 22, by + k - 3.5, 16, 7);
          ctx.fillRect(bx + k - 3.5, by + pad + 6, 7, 16);
          ctx.fillRect(bx + k - 3.5, by - pad - 22, 7, 16);
        }
        ctx.fillStyle = '#1e293b'; ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.stroke();

        ctx.fillStyle = '#94a3b8'; rr(ctx, bx + pad, by + pad, ins, ins, 20); ctx.fill();
        ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 3; ctx.stroke();

        const blockSeed = hash(gx, gy), inset = pad + 18, bs = ins - 36;
        if (blockSeed < 0.72) {
          const sub = bs / 2 - 8;
          const roofs = ['#cbd5e1', '#b45309', '#475569', '#9a3412', '#64748b', '#7c2d12'];
          for (let sx = 0; sx < 2; sx++) {
            for (let sy = 0; sy < 2; sy++) {
              const rx = bx + inset + sx * (sub + 16), ry = by + inset + sy * (sub + 16);
              const rs = hash(gx * 2 + sx, gy * 2 + sy);
              ctx.fillStyle = 'rgba(15, 23, 42, 0.34)'; rr(ctx, rx + 12, ry + 14, sub, sub, 8); ctx.fill();
              ctx.fillStyle = roofs[Math.floor(rs * roofs.length)]; rr(ctx, rx, ry, sub, sub, 8); ctx.fill();
              ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 3; ctx.stroke();
              ctx.fillStyle = 'rgba(15, 23, 42, 0.12)'; rr(ctx, rx + 8, ry + 8, sub - 16, sub - 16, 4); ctx.fill();
            }
          }
        } else {
          ctx.fillStyle = '#4ade80'; rr(ctx, bx + inset, by + inset, bs, bs, 16); ctx.fill();
          ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 18;
          ctx.beginPath();
          ctx.moveTo(bx + inset + 16, by + inset + bs / 2); ctx.lineTo(bx + inset + bs - 16, by + inset + bs / 2);
          ctx.moveTo(bx + inset + bs / 2, by + inset + 16); ctx.lineTo(bx + inset + bs / 2, by + inset + bs - 16);
          ctx.stroke();
          const fx = bx + inset + bs / 2, fy = by + inset + bs / 2;
          ctx.fillStyle = '#cbd5e1'; ctx.beginPath(); ctx.arc(fx, fy, 32, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0ea5e9'; ctx.beginPath(); ctx.arc(fx, fy, 25, 0, Math.PI * 2); ctx.fill();
          for (let t = 0; t < 4; t++) {
            const tx = bx + inset + (t % 2 === 0 ? 52 : bs - 52), ty = by + inset + (t < 2 ? 52 : bs - 52);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.22)'; ctx.beginPath(); ctx.arc(tx + 7, ty + 9, 26, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#15803d'; ctx.beginPath(); ctx.arc(tx, ty, 26, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#22c55e'; ctx.beginPath(); ctx.arc(tx - 5, ty - 5, 16, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    for (const sp of splats) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.arc(sp.x + sp.r * 0.65, sp.y - sp.r * 0.35, sp.r * 0.52, 0, Math.PI * 2);
      ctx.arc(sp.x - sp.r * 0.55, sp.y + sp.r * 0.45, sp.r * 0.44, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const p of perches) {
      if (!p.act) continue;
      const acc = p.rew === 'RAPID' ? '#ef4444' : (p.rew === 'TRIPLE' ? '#38bdf8' : '#f59e0b');
      ctx.save();
      ctx.strokeStyle = bird.alt === 'LOW' ? '#fde047' : 'rgba(255,255,255,0.48)';
      ctx.lineWidth = bird.alt === 'LOW' ? 3 : 1.6; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(p.x, p.y, 27 + Math.sin(p.pulse) * 4.5, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      if (p.kind === 'TREE') {
        ctx.fillStyle = '#15803d'; ctx.beginPath(); ctx.arc(p.x, p.y, 25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = acc;
        for (let b = 0; b < 7; b++) {
          const ba = (b / 7) * Math.PI * 2 + p.pulse * 0.1;
          ctx.beginPath(); ctx.arc(p.x + Math.cos(ba) * 11, p.y + Math.sin(ba) * 11, 4.2, 0, Math.PI * 2); ctx.fill();
        }
      } else {
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(p.x - 18, p.y); ctx.lineTo(p.x + 18, p.y); ctx.stroke();
        ctx.fillStyle = '#78350f'; ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    for (const g of gpigs) {
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.ang);
      ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(5, 0, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    for (const p of peds) {
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = 'rgba(0,0,0,0.26)'; ctx.beginPath(); ctx.arc(3, 4, p.umb ? 12 : 7.5, 0, Math.PI * 2); ctx.fill();
      if (p.umb) {
        ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(0, 0, 12.5, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 5, Math.sin(p.ph) * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fed7aa'; ctx.beginPath(); ctx.arc(0, 0, 4.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.hair; ctx.beginPath(); ctx.arc(-1, 0, 3.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    for (const car of cars) {
      ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.ang);
      const hw = car.w / 2, hh = car.h / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; rr(ctx, -hw + 4, -hh + 5, car.w, car.h, 6); ctx.fill();
      ctx.fillStyle = car.col; rr(ctx, -hw, -hh, car.w, car.h, 6); ctx.fill();
      ctx.fillStyle = '#0f172a'; rr(ctx, hw - 16, -hh + 3, 9, car.h - 6, 2); ctx.fill();
      if (car.conv) {
        ctx.fillStyle = '#fef3c7'; rr(ctx, -12, -hh + 4, 15, car.h - 8, 2); ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.22)'; rr(ctx, -13, -hh + 3, 15, car.h - 6, 3); ctx.fill();
      }
      ctx.restore();
    }

    if (mode === 'PLAY') {
      const a = flightParams();
      const px = bird.x + a.vx * a.dur, py = bird.y + a.vy * a.dur;
      const rad = bird.pwr === 'MEGA' ? 28 : 15;
      ctx.save(); ctx.translate(px, py);
      ctx.strokeStyle = bird.cd <= 0 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 2.2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(0, 0, rad + Math.sin(time * 8) * 1.5, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = bird.cd <= 0 ? '#38bdf8' : '#94a3b8';
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    for (const d of drops) {
      const pr = Math.min(1, d.el / d.dur);
      const sc = (bird.alt === 'HIGH' ? 1.45 : 1.0) * (1 - pr * 0.65);
      ctx.fillStyle = `rgba(15, 23, 42, ${0.14 + pr * 0.28})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, (d.mega ? 20 : 11) * (1 - pr * 0.35), 0, Math.PI * 2); ctx.fill();
      const altOff = (1 - pr * pr) * (bird.alt === 'HIGH' ? 32 : 14);
      ctx.fillStyle = d.mega ? '#fef08a' : '#ffffff';
      ctx.beginPath(); ctx.arc(d.x, d.y - altOff, 7 * sc, 0, Math.PI * 2); ctx.fill();
    }

    for (const pt of particles) {
      ctx.save(); ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.translate(pt.x, pt.y); ctx.rotate(pt.ang); ctx.fillStyle = pt.col;
      if (pt.kind === 'feather') { ctx.beginPath(); ctx.ellipse(0, 0, pt.sz * 1.8, pt.sz * 0.6, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.arc(0, 0, pt.sz, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    for (const w of winds) {
      ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.ang);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.11)'; ctx.beginPath(); ctx.arc(0, 0, w.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.5)'; ctx.lineWidth = 2.5;
      for (let k = -2; k <= 2; k++) {
        const off = ((w.ph * 36 + k * 48) % 180) - 90;
        ctx.beginPath(); ctx.moveTo(off - 24, k * 34); ctx.lineTo(off + 24, k * 34); ctx.stroke();
      }
      ctx.restore();
    }

    for (const h of haz) drawHazardSprite(ctx, h.x, h.y, h.ang, h, bird.alt, time);

    const hi = bird.alt === 'HIGH', soff = hi ? 44 : 14;
    ctx.save(); ctx.translate(bird.x + soff, bird.y + soff + 6); ctx.rotate(bird.ang); ctx.scale(0.65, 0.65);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 6.5, 0, 0, Math.PI * 2); ctx.ellipse(-2, 0, 6.5, 19 + Math.sin(bird.wing) * 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    drawDetailedPigeon(ctx, bird.x, bird.y, bird.ang, bird, hi ? 1.14 : 0.9, time);

    for (const cl of clouds) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath(); ctx.arc(cl.x, cl.y, cl.r, 0, Math.PI * 2); ctx.arc(cl.x + cl.r * 0.65, cl.y - cl.r * 0.2, cl.r * 0.72, 0, Math.PI * 2); ctx.fill();
    }

    ctx.font = '900 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    for (const pop of pops) {
      ctx.globalAlpha = Math.min(1, pop.life * 1.4);
      ctx.fillStyle = '#0f172a'; ctx.fillText(pop.txt, pop.x + 1.2, pop.y + 1.2);
      ctx.fillStyle = pop.col; ctx.fillText(pop.txt, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    if (joy.act) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 50, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.68)';
      ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 50, joy.oy + joy.dy * 50, 21, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  function render(ctx, s) {
    if (s.viewMode === 'ISO') renderIso(ctx, s);
    else renderTop(ctx, s);
  }

  return { render };
})();
