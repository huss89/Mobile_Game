window.TracksRender = (() => {
  const PAL = {
    bg: '#ede6d6', grass1: '#dce5d2', grass2: '#d3dec7',
    woodLight: '#deb887', woodMid: '#c69c6d', woodDark: '#8c6239',
    rail: '#7a7570', water: '#9ec5d1', waterFoam: '#cbe2ea',
    roofs: ['#c97b63', '#7d98a1', '#d4a359', '#8fa889']
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function isoProj(gx, gy, z, tileW, tileH) {
    return {
      x: (gx - gy) * (tileW * 0.5),
      y: (gx + gy) * (tileH * 0.5) - z
    };
  }

  function draw2DTrack(ctx, cx, cy, sz, cell) {
    const t = cell.track;
    if (!t) return;
    const hw = sz * 0.5, tw = sz * 0.34, rw = sz * 0.22;

    const drawStraight = (horiz, elevated) => {
      ctx.save();
      ctx.translate(cx, cy);
      if (!horiz) ctx.rotate(Math.PI / 2);
      if (elevated) {
        ctx.fillStyle = 'rgba(74,63,53,0.22)';
        rr(ctx, -hw - 2, -tw * 0.5 + 6, sz + 4, tw + 2, 4); ctx.fill();
      }
      ctx.fillStyle = elevated ? '#e6c697' : PAL.woodLight;
      rr(ctx, -hw, -tw * 0.5, sz, tw, 3); ctx.fill();
      ctx.strokeStyle = PAL.woodDark; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = PAL.woodMid;
      for (let i = -2; i <= 2; i++) ctx.fillRect(i * (sz * 0.18) - 2, -tw * 0.42, 4, tw * 0.84);
      ctx.strokeStyle = PAL.rail; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-hw, -rw * 0.5); ctx.lineTo(hw, -rw * 0.5);
      ctx.moveTo(-hw, rw * 0.5); ctx.lineTo(hw, rw * 0.5);
      ctx.stroke();
      if (elevated) {
        ctx.fillStyle = PAL.woodDark;
        ctx.fillRect(-hw + 4, -tw * 0.6, 6, tw * 1.2);
        ctx.fillRect(hw - 10, -tw * 0.6, 6, tw * 1.2);
      }
      ctx.restore();
    };

    const drawCurve = (rot) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot * Math.PI / 2);
      const drawArc = (w, col) => {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.arc(hw, -hw, hw, Math.PI * 0.5, Math.PI); ctx.stroke();
      };
      drawArc(tw + 2, PAL.woodDark);
      drawArc(tw - 2, PAL.woodLight);
      ctx.strokeStyle = PAL.rail; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hw, -hw, hw - rw * 0.5, Math.PI * 0.5, Math.PI); ctx.stroke();
      ctx.beginPath(); ctx.arc(hw, -hw, hw + rw * 0.5, Math.PI * 0.5, Math.PI); ctx.stroke();
      ctx.restore();
    };

    if (t.type === 'straight') drawStraight(t.rot % 2 === 1, false);
    else if (t.type === 'curve') drawCurve(t.rot);
    else if (t.type === 'overpass') {
      drawStraight(false, false);
      drawStraight(true, true);
    }
  }

  function draw2DProp(ctx, cx, cy, sz, cell, time) {
    if (!cell.prop) return;
    const sc = cell.pop || 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sc, sc);
    if (cell.prop.kind === 'tree') {
      ctx.fillStyle = 'rgba(74,63,53,0.16)';
      ctx.beginPath(); ctx.arc(3, 5, sz * 0.24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#6b8e78';
      ctx.beginPath(); ctx.arc(0, 0, sz * 0.24, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#89ab94';
      ctx.beginPath(); ctx.arc(-3, -3, sz * 0.14, 0, Math.PI * 2); ctx.fill();
    } else {
      const w = sz * 0.56, h = sz * 0.48;
      ctx.fillStyle = 'rgba(74,63,53,0.18)';
      rr(ctx, -w * 0.5 + 3, -h * 0.5 + 4, w, h, 6); ctx.fill();
      ctx.fillStyle = '#f6efe2';
      rr(ctx, -w * 0.5, -h * 0.5, w, h, 6); ctx.fill();
      ctx.fillStyle = PAL.roofs[cell.prop.col % PAL.roofs.length];
      rr(ctx, -w * 0.46, -h * 0.46, w * 0.92, h * 0.55, 4); ctx.fill();
      ctx.fillStyle = '#8c6239';
      ctx.fillRect(-3, h * 0.12, 6, h * 0.34);
    }
    ctx.restore();
  }

  function draw2DTrain(ctx, train, sz) {
    for (let i = train.cars.length - 1; i >= 0; i--) {
      const car = train.cars[i];
      ctx.save();
      ctx.translate(car.x, car.y - car.z * 8);
      ctx.rotate(car.ang);
      const cw = sz * 0.36, ch = sz * 0.22;
      ctx.fillStyle = 'rgba(74,63,53,0.22)';
      rr(ctx, -cw * 0.5 + 2, -ch * 0.5 + 3, cw, ch, 5); ctx.fill();
      ctx.fillStyle = i === 0 ? '#c97b63' : (i === 1 ? '#d4a359' : '#7d98a1');
      rr(ctx, -cw * 0.5, -ch * 0.5, cw, ch, 5); ctx.fill();
      ctx.strokeStyle = '#5c4d3c'; ctx.lineWidth = 1.5; ctx.stroke();
      if (i === 0) {
        ctx.fillStyle = '#4a3f35';
        ctx.beginPath(); ctx.arc(cw * 0.24, 0, 3.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    }
  }

  function renderIso(ctx, s) {
    const { grid, N, train, time } = s;
    const tw = 88, th = 44, depth = 16;

    // Thick wooden tabletop base
    const p0 = isoProj(0, 0, 0, tw, th), p1 = isoProj(N, 0, 0, tw, th);
    const p2 = isoProj(N, N, 0, tw, th), p3 = isoProj(0, N, 0, tw, th);
    ctx.fillStyle = '#b58d63';
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p1.x, p1.y);
    ctx.lineTo(p1.x, p1.y + depth); ctx.lineTo(p2.x, p2.y + depth); ctx.lineTo(p3.x, p3.y + depth);
    ctx.closePath(); ctx.fill();

    // Painter's order (back to front: gx + gy ascending)
    for (let sum = 0; sum <= (N - 1) * 2; sum++) {
      for (let gx = 0; gx < N; gx++) {
        const gy = sum - gx;
        if (gy < 0 || gy >= N) continue;
        const cell = grid[gy][gx];
        const a = isoProj(gx, gy, 0, tw, th), b = isoProj(gx + 1, gy, 0, tw, th);
        const c = isoProj(gx + 1, gy + 1, 0, tw, th), d = isoProj(gx, gy + 1, 0, tw, th);
        const mid = isoProj(gx + 0.5, gy + 0.5, 0, tw, th);

        // Tile diamond
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y);
        ctx.closePath();
        ctx.fillStyle = cell.water ? PAL.water : ((gx + gy) % 2 === 0 ? PAL.grass1 : PAL.grass2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(92,77,60,0.12)'; ctx.lineWidth = 1; ctx.stroke();

        if (cell.water) {
          const wave = Math.sin(time * 2.5 + gx + gy) * 3;
          ctx.strokeStyle = PAL.waterFoam; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(mid.x - 10 + wave, mid.y); ctx.lineTo(mid.x + 10 + wave, mid.y); ctx.stroke();
        }

        // Track in 2.5D
        if (cell.track) {
          const zOff = cell.water ? 7 : 0;
          if (cell.water) {
            ctx.fillStyle = PAL.woodDark;
            ctx.fillRect(mid.x - 12, mid.y - 4, 4, 8);
            ctx.fillRect(mid.x + 8, mid.y - 4, 4, 8);
          }
          const portPt = (p, z) => {
            const o = [[0.5, 0], [1, 0.5], [0.5, 1], [0, 0.5]][p];
            return isoProj(gx + o[0], gy + o[1], z, tw, th);
          };
          const drawIsoSeg = (pA, pB, z) => {
            const sA = portPt(pA, z), sB = portPt(pB, z), sM = isoProj(gx + 0.5, gy + 0.5, z, tw, th);
            ctx.strokeStyle = PAL.woodDark; ctx.lineWidth = 13; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(sA.x, sA.y); ctx.quadraticCurveTo(sM.x, sM.y, sB.x, sB.y); ctx.stroke();
            ctx.strokeStyle = PAL.woodLight; ctx.lineWidth = 9;
            ctx.beginPath(); ctx.moveTo(sA.x, sA.y); ctx.quadraticCurveTo(sM.x, sM.y, sB.x, sB.y); ctx.stroke();
          };
          const t = cell.track;
          if (t.type === 'straight') drawIsoSeg(t.rot % 2 === 0 ? 0 : 1, t.rot % 2 === 0 ? 2 : 3, zOff);
          else if (t.type === 'curve') drawIsoSeg(t.rot, (t.rot + 1) % 4, zOff);
          else if (t.type === 'overpass') {
            drawIsoSeg(0, 2, 0);
            ctx.fillStyle = PAL.woodDark;
            ctx.fillRect(mid.x - 16, mid.y - 14, 4, 14);
            ctx.fillRect(mid.x + 12, mid.y - 14, 4, 14);
            drawIsoSeg(1, 3, 14);
          }
        }

        // 2.5D Trees & Houses
        if (cell.prop) {
          const sc = cell.pop || 1;
          ctx.save(); ctx.translate(mid.x, mid.y); ctx.scale(sc, sc);
          if (cell.prop.kind === 'tree') {
            ctx.fillStyle = PAL.woodDark; ctx.fillRect(-3, -10, 6, 10);
            ctx.fillStyle = '#5c7f69';
            ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(14, -10); ctx.lineTo(-14, -10); ctx.closePath(); ctx.fill();
            ctx.fillStyle = '#7ea18b';
            ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(11, -22); ctx.lineTo(-11, -22); ctx.closePath(); ctx.fill();
          } else {
            const col = PAL.roofs[cell.prop.col % PAL.roofs.length];
            ctx.fillStyle = '#e8dfd1'; ctx.fillRect(-15, -18, 15, 18);
            ctx.fillStyle = '#f7f1e6'; ctx.fillRect(0, -18, 15, 18);
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.moveTo(-18, -18); ctx.lineTo(0, -32); ctx.lineTo(18, -18); ctx.closePath(); ctx.fill();
          }
          ctx.restore();
        }
      }
    }

    // 2.5D Train cars
    for (let i = train.cars.length - 1; i >= 0; i--) {
      const car = train.cars[i];
      const pt = isoProj(car.gx, car.gy, car.z * 14 + 4, tw, th);
      ctx.save(); ctx.translate(pt.x, pt.y);
      ctx.fillStyle = 'rgba(74,63,53,0.25)';
      ctx.beginPath(); ctx.ellipse(0, 5, 13, 7, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = i === 0 ? '#c97b63' : (i === 1 ? '#d4a359' : '#7d98a1');
      rr(ctx, -11, -12, 22, 14, 5); ctx.fill();
      ctx.strokeStyle = '#4a3f35'; ctx.lineWidth = 1.5; ctx.stroke();
      if (i === 0) {
        ctx.fillStyle = '#4a3f35'; ctx.fillRect(-3, -18, 6, 6);
      }
      ctx.restore();
    }
  }

  function render(ctx, s) {
    const { W, H, cam, iso, grid, N, sz, train, time } = s;
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.translate(W * 0.5 + cam.x, H * 0.5 + cam.y);
    ctx.scale(cam.zoom, cam.zoom);

    if (iso) {
      renderIso(ctx, s);
    } else {
      const board = N * sz;
      ctx.translate(-board * 0.5, -board * 0.5);
      // Wooden table frame
      ctx.fillStyle = '#c69c6d';
      rr(ctx, -14, -14, board + 28, board + 28, 22); ctx.fill();
      ctx.strokeStyle = '#8c6239'; ctx.lineWidth = 3; ctx.stroke();

      for (let gy = 0; gy < N; gy++) {
        for (let gx = 0; gx < N; gx++) {
          const x = gx * sz, y = gy * sz, cell = grid[gy][gx];
          ctx.fillStyle = cell.water ? PAL.water : ((gx + gy) % 2 === 0 ? PAL.grass1 : PAL.grass2);
          ctx.fillRect(x, y, sz, sz);
          ctx.strokeStyle = 'rgba(92,77,60,0.12)'; ctx.lineWidth = 1;
          ctx.strokeRect(x, y, sz, sz);
          if (cell.water) {
            const wv = Math.sin(time * 2.2 + gx + gy) * 4;
            ctx.strokeStyle = PAL.waterFoam; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(x + 14 + wv, y + sz * 0.5); ctx.lineTo(x + sz - 14 + wv, y + sz * 0.5); ctx.stroke();
          }
          draw2DTrack(ctx, x + sz * 0.5, y + sz * 0.5, sz, cell);
          draw2DProp(ctx, x + sz * 0.5, y + sz * 0.5, sz, cell, time);
        }
      }
      draw2DTrain(ctx, train, sz);
    }
    ctx.restore();
  }

  return { render, isoProj };
})();
