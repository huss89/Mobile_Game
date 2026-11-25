window.FlybyRender = (() => {
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }

  function drawDetailedPigeon(ctx, bird, scale, time) {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.ang);
    ctx.scale(scale, (1 - Math.abs(bird.bank) * 0.22) * scale);

    // Power-up Aura Ring
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

    // Pink Feet (extend slightly when swooping LOW to perch)
    if (bird.alt === 'LOW') {
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 1.6;
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-4, side * 3.5);
        ctx.lineTo(-9, side * 5.2);
        ctx.moveTo(-9, side * 5.2);
        ctx.lineTo(-11.5, side * 6.5);
        ctx.moveTo(-9, side * 5.2);
        ctx.lineTo(-11.5, side * 3.8);
        ctx.stroke();
      }
    }

    // Articulated 3-Segment Wings (Asymmetric fast downstroke, folded upstroke)
    const rs = Math.sin(bird.wing);
    const stroke = rs >= 0 ? Math.pow(rs, 0.72) : -Math.pow(-rs, 1.35);
    const sweep = Math.cos(bird.wing);
    const lightShift = Math.round(stroke * 18); // Subtle lighting shift on wingbeat

    for (const side of [-1, 1]) {
      const bankMod = 1 + side * bird.bank * 0.18;
      const span = (31 + stroke * 13) * bankMod;
      const wx = 3.5 + stroke * 4.8 + sweep * 2.4;
      const wy = side * (span * 0.56);
      const tx = -11.5 + stroke * 8 - sweep * 4.8;
      const ty = side * span;

      // 8 Individual Fanned Primary Flight Feathers
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

        // Dark charcoal primary feather tip
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(fx - 1.1, fy - side * 1.1, 2.0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main Silver-Grey Wing Coverts with Dynamic Stroke Gradient
      const c1 = 203 + lightShift;
      const c2 = 148 + lightShift;
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

      // Dual Classic Rock-Pigeon Black Wing Bars
      ctx.strokeStyle = '#0f172a';
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-0.5, side * 6);
      ctx.quadraticCurveTo(wx - 2.8, wy * 0.68, -4, wy * 0.89);
      ctx.stroke();

      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(-5, side * 5.2);
      ctx.quadraticCurveTo(wx - 6, wy * 0.56, -8.2, wy * 0.74);
      ctx.stroke();

      // Leading-edge sunlit feather rim
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(6, side * 3.8);
      ctx.quadraticCurveTo(wx + 3, wy * 0.62, wx, wy);
      ctx.stroke();
    }

    // Spreadable Fan Tail with Dark Terminal Band & White Outer Trim
    const ta = 0.22 + bird.tail * 0.44;
    const tLen = 24;
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-tLen, -Math.sin(ta) * tLen);
    ctx.quadraticCurveTo(-tLen - 3, 0, -tLen, Math.sin(ta) * tLen);
    ctx.closePath();
    ctx.fill();

    // White outer tail edges
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-11, -2.5); ctx.lineTo(-tLen + 1, -Math.sin(ta) * (tLen - 1));
    ctx.moveTo(-11, 2.5); ctx.lineTo(-tLen + 1, Math.sin(ta) * (tLen - 1));
    ctx.stroke();

    // Dark terminal tail band
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(-tLen + 3.5, -Math.sin(ta) * (tLen - 3.5));
    ctx.quadraticCurveTo(-tLen + 0.8, 0, -tLen + 3.5, Math.sin(ta) * (tLen - 3.5));
    ctx.stroke();

    // White Lower Back / Rump Patch
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(-9.2, 0, 5.8, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Plump Torso
    const bg = ctx.createLinearGradient(-12, 0, 14, 0);
    bg.addColorStop(0, '#94a3b8');
    bg.addColorStop(0.55, '#e2e8f0');
    bg.addColorStop(1, '#64748b');
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 8.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shimmering Iridescent Neck Sheen (shifts slightly with heading)
    const shimmer = 0.5 + 0.5 * Math.sin(bird.ang * 2 + time * 3);
    const ng = ctx.createLinearGradient(5, -6, 12, 6);
    ng.addColorStop(0, shimmer > 0.5 ? '#10b981' : '#34d399');
    ng.addColorStop(0.5, shimmer > 0.5 ? '#c084fc' : '#a855f7');
    ng.addColorStop(1, '#059669');
    ctx.fillStyle = ng;
    ctx.beginPath();
    ctx.ellipse(8.8, 0, 5.6, 6.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head, Amber Eyes, Dark Beak & White Cere
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(13.8, 0, 5.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(14.8, -3.5, 1.6, 0, Math.PI * 2);
    ctx.arc(14.8, 3.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(15.2, -3.5, 0.75, 0, Math.PI * 2);
    ctx.arc(15.2, 3.5, 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(18.2, -2.2);
    ctx.lineTo(24.5, 0);
    ctx.lineTo(18.2, 2.2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(18.5, 0, 1.5, 2.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function render(ctx, s) {
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

    // 1. Asphalt Road Grid
    const gx0 = Math.floor(camX / CELL) - 1, gx1 = Math.floor((camX + vW) / CELL) + 1;
    const gy0 = Math.floor(camY / CELL) - 1, gy1 = Math.floor((camY + vH) / CELL) + 1;

    ctx.fillStyle = '#2d3748';
    ctx.fillRect(gx0 * CELL, gy0 * CELL, (gx1 - gx0 + 1) * CELL, (gy1 - gy0 + 1) * CELL);

    // 2. City Blocks, Roads, Architecture & Parks
    for (let gx = gx0; gx <= gx1; gx++) {
      for (let gy = gy0; gy <= gy1; gy++) {
        const bx = gx * CELL, by = gy * CELL;
        const pad = ROAD / 2, ins = CELL - ROAD;

        // Road Center Double-Yellow Dashed Lines
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.52)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([18, 16]);
        ctx.beginPath();
        ctx.moveTo(bx + pad + 18, by); ctx.lineTo(bx + CELL - pad - 18, by);
        ctx.moveTo(bx, by + pad + 18); ctx.lineTo(bx, by + CELL - pad - 18);
        ctx.stroke();
        ctx.setLineDash([]);

        // Crosswalks & Manhole Cover at Intersection
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

        // Sidewalk Slab with Curb Outline
        ctx.fillStyle = '#94a3b8';
        rr(ctx, bx + pad, by + pad, ins, ins, 20);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.stroke();

        const blockSeed = hash(gx, gy);
        const inset = pad + 18, bs = ins - 36;

        if (blockSeed < 0.72) {
          // 2x2 Architectural Rooftops
          const sub = bs / 2 - 8;
          const roofs = ['#cbd5e1', '#b45309', '#475569', '#9a3412', '#64748b', '#7c2d12'];
          for (let sx = 0; sx < 2; sx++) {
            for (let sy = 0; sy < 2; sy++) {
              const rx = bx + inset + sx * (sub + 16);
              const ry = by + inset + sy * (sub + 16);
              const rs = hash(gx * 2 + sx, gy * 2 + sy);

              // Deep Building Cast Shadow
              ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
              rr(ctx, rx + 12, ry + 14, sub, sub, 8);
              ctx.fill();

              // Main Roof Slab
              ctx.fillStyle = roofs[Math.floor(rs * roofs.length)];
              rr(ctx, rx, ry, sub, sub, 8);
              ctx.fill();

              // Inner Parapet Rim
              ctx.strokeStyle = 'rgba(255,255,255,0.22)';
              ctx.lineWidth = 3;
              ctx.stroke();
              ctx.fillStyle = 'rgba(15, 23, 42, 0.12)';
              rr(ctx, rx + 8, ry + 8, sub - 16, sub - 16, 4);
              ctx.fill();

              // Rooftop Details: Spinning HVAC Unit, Skylight, Water Tower, or Solar Panels
              if (rs < 0.33) {
                // HVAC Unit + Spinning Fan
                ctx.fillStyle = '#475569';
                rr(ctx, rx + 18, ry + 18, 36, 36, 4); ctx.fill();
                ctx.fillStyle = '#1e293b';
                ctx.beginPath(); ctx.arc(rx + 36, ry + 36, 12, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
                const fa = time * 4 + rs * 10;
                ctx.beginPath();
                ctx.moveTo(rx + 36 + Math.cos(fa) * 10, ry + 36 + Math.sin(fa) * 10);
                ctx.lineTo(rx + 36 - Math.cos(fa) * 10, ry + 36 - Math.sin(fa) * 10);
                ctx.stroke();
              } else if (rs < 0.62) {
                // Glass Skylight
                ctx.fillStyle = '#0ea5e9';
                rr(ctx, rx + 22, ry + 22, sub - 44, sub * 0.32, 4); ctx.fill();
                ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2; ctx.stroke();
              } else if (rs < 0.82) {
                // Solar Panel Array
                ctx.fillStyle = '#1e3a8a';
                for (let p = 0; p < 3; p++) {
                  rr(ctx, rx + 18 + p * 44, ry + 20, 36, 56, 3); ctx.fill();
                  ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1; ctx.stroke();
                }
              } else {
                // Classic NYC Wooden Water Tower
                ctx.fillStyle = 'rgba(0,0,0,0.28)';
                ctx.beginPath(); ctx.arc(rx + sub - 34, ry + 42, 18, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#92400e';
                ctx.beginPath(); ctx.arc(rx + sub - 38, ry + 38, 17, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#b45309';
                ctx.beginPath(); ctx.arc(rx + sub - 38, ry + 38, 11, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#451a03';
                ctx.beginPath(); ctx.arc(rx + sub - 38, ry + 38, 3, 0, Math.PI * 2); ctx.fill();
              }
            }
          }
        } else {
          // Lush City Park Block
          ctx.fillStyle = '#4ade80';
          rr(ctx, bx + inset, by + inset, bs, bs, 16);
          ctx.fill();

          // Stone Cross Paths
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 18;
          ctx.beginPath();
          ctx.moveTo(bx + inset + 16, by + inset + bs / 2);
          ctx.lineTo(bx + inset + bs - 16, by + inset + bs / 2);
          ctx.moveTo(bx + inset + bs / 2, by + inset + 16);
          ctx.lineTo(bx + inset + bs / 2, by + inset + bs - 16);
          ctx.stroke();

          // Park Benches along Paths
          ctx.fillStyle = '#92400e';
          ctx.fillRect(bx + inset + 60, by + inset + bs / 2 - 18, 24, 7);
          ctx.fillRect(bx + inset + bs - 84, by + inset + bs / 2 + 11, 24, 7);

          // Animated Central Fountain
          const fx = bx + inset + bs / 2, fy = by + inset + bs / 2;
          ctx.fillStyle = 'rgba(15,23,42,0.2)';
          ctx.beginPath(); ctx.arc(fx + 5, fy + 6, 32, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath(); ctx.arc(fx, fy, 32, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#0ea5e9';
          ctx.beginPath(); ctx.arc(fx, fy, 25, 0, Math.PI * 2); ctx.fill();

          // Rippling Water Rings
          const rip = (time * 18) % 20;
          ctx.strokeStyle = `rgba(224, 242, 254, ${1 - rip / 20})`;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(fx, fy, 4 + rip, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = '#f0f9ff';
          ctx.beginPath(); ctx.arc(fx, fy, 5 + Math.sin(time * 8) * 1.2, 0, Math.PI * 2); ctx.fill();

          // Layered Park Trees
          for (let t = 0; t < 4; t++) {
            const tx = bx + inset + (t % 2 === 0 ? 52 : bs - 52);
            const ty = by + inset + (t < 2 ? 52 : bs - 52);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
            ctx.beginPath(); ctx.arc(tx + 7, ty + 9, 26, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#15803d';
            ctx.beginPath(); ctx.arc(tx, ty, 26, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#22c55e';
            ctx.beginPath(); ctx.arc(tx - 5, ty - 5, 16, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    // 3. Ground Splats (Organic multi-blob splat decals)
    for (const sp of splats) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r, 0, Math.PI * 2);
      ctx.arc(sp.x + sp.r * 0.65, sp.y - sp.r * 0.35, sp.r * 0.52, 0, Math.PI * 2);
      ctx.arc(sp.x - sp.r * 0.55, sp.y + sp.r * 0.45, sp.r * 0.44, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Perch Power-Ups (Berry Trees & Utility Nest Poles)
    for (const p of perches) {
      if (!p.act) continue;
      const acc = p.rew === 'RAPID' ? '#ef4444' : (p.rew === 'TRIPLE' ? '#38bdf8' : '#f59e0b');
      const glowR = 27 + Math.sin(p.pulse) * 4.5;

      ctx.save();
      ctx.strokeStyle = bird.alt === 'LOW' ? '#fde047' : 'rgba(255,255,255,0.48)';
      ctx.lineWidth = bird.alt === 'LOW' ? 3 : 1.6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);

      if (p.kind === 'TREE') {
        ctx.fillStyle = 'rgba(15,23,42,0.28)';
        ctx.beginPath(); ctx.arc(p.x + 6, p.y + 8, 25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.beginPath(); ctx.arc(p.x, p.y, 25, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.beginPath(); ctx.arc(p.x - 4, p.y - 4, 17, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = acc;
        for (let b = 0; b < 7; b++) {
          const ba = (b / 7) * Math.PI * 2 + p.pulse * 0.1;
          ctx.beginPath();
          ctx.arc(p.x + Math.cos(ba) * 11, p.y + Math.sin(ba) * 11, 4.2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Utility Pole + Crossbar + Twig Nest + Glowing Egg/Seed
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(p.x - 14, p.y + 3, 32, 5);
        ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(p.x - 18, p.y); ctx.lineTo(p.x + 18, p.y); ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath(); ctx.arc(p.x - 15, p.y, 3, 0, Math.PI * 2); ctx.arc(p.x + 15, p.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#78350f';
        ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.beginPath(); ctx.arc(p.x, p.y, 9.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = acc;
        ctx.beginPath(); ctx.arc(p.x, p.y, 5.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // 5. Ambient Sidewalk Pigeons
    for (const g of gpigs) {
      ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.ang);
      if (g.sc) {
        const fl = Math.sin(g.ph * 2.8) * 9;
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.ellipse(0, 0, 3.5, 9 + fl, 0, 0, Math.PI * 2); ctx.fill();
      }
      const nod = g.sc ? 0 : Math.max(0, Math.sin(g.ph)) * 2.5;
      ctx.fillStyle = '#64748b'; ctx.beginPath(); ctx.ellipse(0, 0, 5.5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#334155'; ctx.beginPath(); ctx.arc(5 + nod, 0, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // 6. Pedestrians
    for (const p of peds) {
      ctx.save(); ctx.translate(p.x, p.y);
      ctx.fillStyle = 'rgba(0,0,0,0.26)';
      ctx.beginPath(); ctx.arc(3, 4, p.umb ? 12 : 7.5, 0, Math.PI * 2); ctx.fill();
      if (p.umb) {
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.arc(0, 0, 12.5, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.2;
        for (let k = 0; k < 4; k++) {
          const a = k * (Math.PI / 4);
          ctx.beginPath(); ctx.moveTo(-Math.cos(a) * 12, -Math.sin(a) * 12); ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12); ctx.stroke();
        }
      } else {
        ctx.fillStyle = p.col;
        ctx.beginPath(); ctx.ellipse(0, 0, 8.5, 5, Math.sin(p.ph) * 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath(); ctx.arc(0, 0, 4.6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.hair;
        ctx.beginPath(); ctx.arc(-1, 0, 3.6, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }

    // 7. Detailed Vehicles (Yellow Cabs, Convertibles, Vans, Sedans)
    for (const car of cars) {
      ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.ang);
      const hw = car.w / 2, hh = car.h / 2;

      // Soft Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      rr(ctx, -hw + 4, -hh + 5, car.w, car.h, 6); ctx.fill();

      // Headlight Beams
      ctx.fillStyle = 'rgba(254, 240, 138, 0.14)';
      ctx.beginPath();
      ctx.moveTo(hw, -hh + 3); ctx.lineTo(hw + 22, -hh - 4); ctx.lineTo(hw + 22, hh + 4); ctx.lineTo(hw, hh - 3);
      ctx.closePath(); ctx.fill();

      // Body
      ctx.fillStyle = car.col;
      rr(ctx, -hw, -hh, car.w, car.h, 6); ctx.fill();

      // Windshield
      ctx.fillStyle = '#0f172a';
      rr(ctx, hw - 16, -hh + 3, 9, car.h - 6, 2); ctx.fill();

      if (car.conv) {
        // Open Convertible Interior & Driver
        ctx.fillStyle = '#fef3c7';
        rr(ctx, -12, -hh + 4, 15, car.h - 8, 2); ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.beginPath(); ctx.arc(-2, -3.5, 3.2, 0, Math.PI * 2); ctx.fill();
      } else if (car.van) {
        // Cargo Van Roof Ribs
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        rr(ctx, -hw + 3, -hh + 3, car.w - 22, car.h - 6, 3); ctx.fill();
      } else {
        // Sedan Roof
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        rr(ctx, -13, -hh + 3, 15, car.h - 6, 3); ctx.fill();
        if (car.taxi) {
          // NYC Taxi Roof Sign
          ctx.fillStyle = '#fef08a';
          rr(ctx, -4, -5, 6, 10, 2); ctx.fill();
          ctx.strokeStyle = '#0f172a'; ctx.lineWidth = 1; ctx.stroke();
        }
      }

      // Taillights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-hw, -hh + 2, 2.5, 4);
      ctx.fillRect(-hw, hh - 6, 2.5, 4);
      ctx.restore();
    }

    // 8. Predictive Ground Aim Reticle
    if (mode === 'PLAY') {
      const a = flightParams();
      const px = bird.x + a.vx * a.dur, py = bird.y + a.vy * a.dur;
      const rad = bird.pwr === 'MEGA' ? 28 : 15;
      ctx.save(); ctx.translate(px, py);
      ctx.strokeStyle = bird.cd <= 0 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(148, 163, 184, 0.45)';
      ctx.lineWidth = 2.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.arc(0, 0, rad + Math.sin(time * 8) * 1.5, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = bird.cd <= 0 ? '#38bdf8' : '#94a3b8';
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // 9. Falling Drops
    for (const d of drops) {
      const pr = Math.min(1, d.el / d.dur);
      const sc = (bird.alt === 'HIGH' ? 1.45 : 1.0) * (1 - pr * 0.65);
      ctx.fillStyle = `rgba(15, 23, 42, ${0.14 + pr * 0.28})`;
      ctx.beginPath(); ctx.arc(d.x, d.y, (d.mega ? 20 : 11) * (1 - pr * 0.35), 0, Math.PI * 2); ctx.fill();
      const altOff = (1 - pr * pr) * (bird.alt === 'HIGH' ? 32 : 14);
      ctx.fillStyle = d.mega ? '#fef08a' : '#ffffff';
      ctx.beginPath(); ctx.arc(d.x, d.y - altOff, 7 * sc, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1.4; ctx.stroke();
    }

    // 10. Particles (Feathers, Splat Bursts, Sparkles)
    for (const pt of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.translate(pt.x, pt.y);
      ctx.rotate(pt.ang);
      ctx.fillStyle = pt.col;
      if (pt.kind === 'feather') {
        ctx.beginPath(); ctx.ellipse(0, 0, pt.sz * 1.8, pt.sz * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(0, 0, pt.sz, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // 11. Wind Gust Zones (Swirling Air Ribbons)
    for (const w of winds) {
      ctx.save(); ctx.translate(w.x, w.y); ctx.rotate(w.ang);
      ctx.fillStyle = 'rgba(186, 230, 253, 0.11)';
      ctx.beginPath(); ctx.arc(0, 0, w.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.5)';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      for (let k = -2; k <= 2; k++) {
        const off = ((w.ph * 36 + k * 48) % 180) - 90;
        const yOff = k * 34;
        ctx.beginPath();
        ctx.moveTo(off - 24, yOff);
        ctx.quadraticCurveTo(off, yOff + Math.sin(w.ph + k) * 9, off + 24, yOff);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 12. Detailed Aerial Hazards (News Heli, Delivery Drone, Territorial Hawk)
    for (const h of haz) {
      ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.ang);
      ctx.globalAlpha = bird.alt === 'LOW' ? 0.32 : 1.0;

      if (h.tp === 'HELI') {
        ctx.fillStyle = '#dc2626'; rr(ctx, -22, -11, 36, 22, 8); ctx.fill();
        ctx.fillStyle = '#991b1b'; ctx.fillRect(-40, -3, 20, 6);
        ctx.fillStyle = '#bae6fd'; rr(ctx, 4, -8, 10, 16, 4); ctx.fill();
        // Blinking Strobe Light
        if (Math.sin(time * 12) > 0) {
          ctx.fillStyle = '#f87171';
          ctx.beginPath(); ctx.arc(-38, 0, 4, 0, Math.PI * 2); ctx.fill();
        }
        // Rotor Blur Disc + Blades
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
        // Tiny Cardboard Package underneath
        ctx.fillStyle = '#d97706'; rr(ctx, -6, -6, 12, 12, 2); ctx.fill();
        for (const [rx, ry] of [[-14, -14], [14, -14], [-14, 14], [14, 14]]) {
          ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.beginPath(); ctx.arc(rx, ry, 8, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5; ctx.stroke();
        }
      } else {
        // Territorial Hawk
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

    // 13. Player City Pigeon Shadow & Body
    const hi = bird.alt === 'HIGH';
    const soff = hi ? 44 : 14;
    ctx.save();
    ctx.translate(bird.x + soff, bird.y + soff + 6);
    ctx.rotate(bird.ang);
    ctx.scale(0.65, 0.65);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 6.5, 0, 0, Math.PI * 2);
    ctx.ellipse(-2, 0, 6.5, 19 + Math.sin(bird.wing) * 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawDetailedPigeon(ctx, bird, hi ? 1.14 : 0.9, time);

    // 14. Drifting High-Altitude Clouds (Subtle atmospheric depth)
    for (const cl of clouds) {
      ctx.save();
      ctx.translate(cl.x, cl.y);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.arc(0, 0, cl.r, 0, Math.PI * 2);
      ctx.arc(cl.r * 0.65, -cl.r * 0.2, cl.r * 0.72, 0, Math.PI * 2);
      ctx.arc(-cl.r * 0.6, cl.r * 0.15, cl.r * 0.68, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 15. Score & Event Popups
    ctx.font = '900 14px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    for (const pop of pops) {
      ctx.globalAlpha = Math.min(1, pop.life * 1.4);
      ctx.fillStyle = '#0f172a';
      ctx.fillText(pop.txt, pop.x + 1.2, pop.y + 1.2);
      ctx.fillStyle = pop.col;
      ctx.fillText(pop.txt, pop.x, pop.y);
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // 16. Virtual Joystick Overlay
    if (joy.act) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(joy.ox, joy.oy, 50, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.68)';
      ctx.beginPath(); ctx.arc(joy.ox + joy.dx * 50, joy.oy + joy.dy * 50, 21, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  return { render };
})();
