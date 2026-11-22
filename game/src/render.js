// Nightvault — drawing. Everything is painted on one canvas in code:
// marble floors and gold trim, indigo shadow carpets, hedges, crates and
// glass cases for cover, paintings on the walls, and two colours of
// light to read at a glance — the guards' flashlight cones, warm white
// when calm, amber as a meter fills, red on the chase, and the cameras'
// cold cyan gaze, which goes violet then magenta as its alarm fills.
// Both cones are clipped by walls, so what is lit is exactly what is seen.

import { TILE, COLS, ROWS } from './levels.js';
import { CONE_RANGE, CONE_HALF_ANGLE, lineOfSight } from './vision.js';
import { CAM_RANGE, CAM_HALF_ANGLE } from './cameras.js';
import { WORLD_W, WORLD_H } from './input.js';

const INK = '#0b0e1a';

// A steady per-tile hash, so the paintings and floor inlay are the same
// on every visit and never flicker between frames.
function tileHash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bf03635;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function conePolygon(ctx, grid, x, y, angle, range, halfAngle) {
  // Fan of rays across the cone; each ray stops where sight stops.
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= steps; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    // Binary-search the wall distance along this ray.
    let lo = 0;
    let hi = range;
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2;
      const px = x + Math.cos(a) * mid;
      const py = y + Math.sin(a) * mid;
      if (lineOfSight(grid, x, y, px, py)) lo = mid;
      else hi = mid;
    }
    ctx.lineTo(x + Math.cos(a) * lo, y + Math.sin(a) * lo);
  }
  ctx.closePath();
}

function coneColor(alert, alpha) {
  if (alert >= 0.99) return `rgba(255, 70, 50, ${alpha})`;
  if (alert >= 0.35) return `rgba(255, 176, 66, ${alpha})`;
  return `rgba(255, 240, 190, ${alpha})`;
}

function camConeColor(fill, alpha) {
  if (fill >= 0.66) return `rgba(255, 64, 110, ${alpha})`;
  if (fill >= 0.3) return `rgba(198, 110, 255, ${alpha})`;
  return `rgba(80, 220, 255, ${alpha})`;
}

export function drawWorld(ctx, game) {
  const { grid } = game.level;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // Floor and cover tiles.
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      const px = x * TILE;
      const py = y * TILE;
      if (c === '#') {
        ctx.fillStyle = '#232842';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#2d3358';
        ctx.fillRect(px + 2, py + 2, TILE - 4, 3);
        // A painting hangs on some wall faces that overlook a room —
        // the museum showing off what the night shift is guarding.
        const below = y + 1 < ROWS ? grid[y + 1][x] : '#';
        if (below !== '#' && tileHash(x, y) < 0.3) {
          const art = ['#7a2e35', '#2e5d7a', '#6b5a2e', '#3d6b4f', '#5a2e6b'][Math.floor(tileHash(y, x) * 5)];
          ctx.fillStyle = '#8a6d2f';
          ctx.fillRect(px + 6, py + 7, TILE - 12, TILE - 13);
          ctx.fillStyle = art;
          ctx.fillRect(px + 8, py + 9, TILE - 16, TILE - 17);
          ctx.fillStyle = 'rgba(255,255,255,0.20)';
          ctx.fillRect(px + 10, py + 11, 5, 3);
        }
        continue;
      }
      // Marble checker, dim so the cones read against it.
      ctx.fillStyle = (x + y) % 2 === 0 ? '#12152a' : '#0e1120';
      ctx.fillRect(px, py, TILE, TILE);
      if (c === '.') {
        // A faint gold inlay diamond on some open marble — richness
        // that never shouts over the light.
        const h = tileHash(x, y);
        if (h > 0.42 && h < 0.5) {
          ctx.strokeStyle = 'rgba(201, 162, 39, 0.13)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 16, py + 8);
          ctx.lineTo(px + 24, py + 16);
          ctx.lineTo(px + 16, py + 24);
          ctx.lineTo(px + 8, py + 16);
          ctx.closePath();
          ctx.stroke();
        }
      }
      if (c === ',') {
        ctx.fillStyle = '#241d4d';
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.strokeStyle = '#8a6d2f';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 4.5, py + 4.5, TILE - 9, TILE - 9);
      } else if (c === 'B') {
        ctx.fillStyle = '#12291a';
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#1d4229';
        for (const [ox, oy, r] of [[9, 10, 8], [22, 8, 9], [15, 20, 10], [25, 23, 7], [7, 24, 6]]) {
          ctx.beginPath();
          ctx.arc(px + ox, py + oy, r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#2c5c39';
        for (const [ox, oy, r] of [[12, 12, 4], [21, 18, 4], [16, 7, 3]]) {
          ctx.beginPath();
          ctx.arc(px + ox, py + oy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (c === 'C') {
        ctx.fillStyle = '#4a3520';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = '#6e5230';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.beginPath();
        ctx.moveTo(px + 3, py + 3);
        ctx.lineTo(px + TILE - 3, py + TILE - 3);
        ctx.moveTo(px + TILE - 3, py + 3);
        ctx.lineTo(px + 3, py + TILE - 3);
        ctx.stroke();
      } else if (c === '=') {
        ctx.fillStyle = '#1c2f45';
        ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = 'rgba(140, 200, 255, 0.20)';
        ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = '#c9a227';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.moveTo(px + 7, py + TILE - 7);
        ctx.lineTo(px + 15, py + 7);
        ctx.stroke();
      }
    }
  }

  drawExit(ctx, game);
  for (const gem of game.level.gems) if (!gem.taken) drawGem(ctx, gem, game.time);

  // Light cones, additively over the dark floor: first the cameras'
  // cold gaze, then the guards' warm flashlights over it.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const cam of game.cameras) {
    conePolygon(ctx, grid, cam.x, cam.y, cam.angle, CAM_RANGE, CAM_HALF_ANGLE);
    const grad = ctx.createRadialGradient(cam.x, cam.y, 4, cam.x, cam.y, CAM_RANGE);
    grad.addColorStop(0, camConeColor(cam.fill, 0.3));
    grad.addColorStop(1, camConeColor(cam.fill, 0.02));
    ctx.fillStyle = grad;
    ctx.fill();
  }
  for (const g of game.guards) {
    conePolygon(ctx, grid, g.x, g.y, g.angle, CONE_RANGE, CONE_HALF_ANGLE);
    const grad = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, CONE_RANGE);
    grad.addColorStop(0, coneColor(g.alert, 0.38));
    grad.addColorStop(1, coneColor(g.alert, 0.02));
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();

  if (game.coin) drawCoin(ctx, game.coin);
  for (const cam of game.cameras) drawCamera(ctx, cam);
  for (const g of game.guards) drawGuard(ctx, g, game.time);
  drawPlayer(ctx, game.player, game.time);

  // A vignette to deepen the dark at the room's edges, so lit ground
  // reads as safety and the black reads as risk.
  const vg = ctx.createRadialGradient(WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.42, WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.88);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // The alarm's flash, on the frame it trips and fading after.
  if (game.alarmFlash > 0.02) {
    ctx.strokeStyle = `rgba(255, 50, 40, ${0.55 * game.alarmFlash})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, WORLD_W - 10, WORLD_H - 10);
  }
}

function drawCamera(ctx, cam) {
  // The fill ring first, in the cone's own colours, so a camera about
  // to trip reads from across the room.
  if (cam.fill > 0.02) {
    ctx.strokeStyle = camConeColor(cam.fill, 0.95);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 12.5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * cam.fill);
    ctx.stroke();
  }
  // Ceiling dome: a dark housing, a glass belly, the lens turned the
  // way the gaze points, and the little red eye that brightens as the
  // meter fills.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(cam.x, cam.y + 7, 8.6, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a3350';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 8.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#54628c';
  ctx.lineWidth = 1.4;
  ctx.stroke();
  ctx.fillStyle = '#10182e';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 5.6, 0, Math.PI * 2);
  ctx.fill();
  const lx = cam.x + Math.cos(cam.angle) * 3.1;
  const ly = cam.y + Math.sin(cam.angle) * 3.1;
  ctx.fillStyle = '#0a0f1e';
  ctx.beginPath();
  ctx.arc(lx, ly, 2.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(140, 230, 255, 0.85)';
  ctx.beginPath();
  ctx.arc(lx - 0.8, ly - 0.8, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(255, 60, 50, ${0.3 + 0.7 * cam.fill})`;
  ctx.beginPath();
  ctx.arc(cam.x, cam.y - 6.4, 1.7, 0, Math.PI * 2);
  ctx.fill();
}

function drawExit(ctx, game) {
  const e = game.level.exit;
  if (!e) return;
  const open = game.level.gems.every((g) => g.taken);
  const px = e.tx * TILE;
  const py = e.ty * TILE;
  ctx.fillStyle = open ? '#0f3d2e' : '#2a1215';
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  ctx.strokeStyle = open ? '#3ddc97' : '#7a2e35';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
  ctx.fillStyle = open ? '#3ddc97' : '#7a2e35';
  ctx.beginPath();
  ctx.moveTo(px + 22, py + 16);
  ctx.lineTo(px + 14, py + 10);
  ctx.lineTo(px + 14, py + 22);
  ctx.closePath();
  ctx.fill();
  if (open) {
    const pulse = 0.13 + 0.07 * Math.sin(game.time * 3.2);
    ctx.fillStyle = `rgba(61, 220, 151, ${pulse})`;
    ctx.fillRect(px - 6, py - 6, TILE + 12, TILE + 12);
  }
}

function drawGem(ctx, gem, time) {
  const bob = Math.sin(time * 2.4 + gem.bob) * 2.5;
  const y = gem.y + bob;
  // The pedestal it floats over: a dark plinth with a gold rim, so the
  // loot sits in the room instead of hovering over the marble.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(gem.x, gem.y + 10, 10.5, 3.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#241d10';
  ctx.beginPath();
  ctx.ellipse(gem.x, gem.y + 8.6, 9, 3.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.save();
  ctx.translate(gem.x, y);
  ctx.fillStyle = 'rgba(94, 234, 255, 0.18)';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5eeaff';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(7, 0);
  ctx.lineTo(0, 10);
  ctx.lineTo(-7, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8fbff';
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(3.5, 0);
  ctx.lineTo(0, 10);
  ctx.lineTo(-3.5, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  // Sparkles on a slow orbit, twinkling in turn — the loot advertises
  // itself across a dark room, which is the whole temptation.
  for (let i = 0; i < 3; i++) {
    const a = time * 1.6 + gem.bob + (i * Math.PI * 2) / 3;
    const sx = gem.x + Math.cos(a) * 13.5;
    const sy = y + Math.sin(a) * 10;
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(time * 2.2 + gem.bob * 2 + i * 2.1));
    const s = 3.4 * tw;
    ctx.strokeStyle = `rgba(234, 252, 255, ${0.75 * tw})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx - s, sy);
    ctx.lineTo(sx + s, sy);
    ctx.moveTo(sx, sy - s);
    ctx.lineTo(sx, sy + s);
    ctx.stroke();
  }
}

function drawCoin(ctx, coin) {
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(coin.x, coin.y - coin.height, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(coin.x, coin.y + 2, 4.5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawGuard(ctx, g, time) {
  // Alert ring + icon first, so the state reads at a glance.
  if (g.alert > 0.02) {
    ctx.strokeStyle = g.alert >= 0.99 ? '#ff4632' : g.alert >= 0.35 ? '#ffb042' : '#ffe9a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * g.alert);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(g.x, g.y + 9, 9, 3.4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Uniform: deep red coat, pale face, cap brim toward facing.
  ctx.fillStyle = '#8e2432';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c39e';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 5.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5d1622';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 6.4, Math.PI * 0.95, Math.PI * 2.05);
  ctx.fill();
  const fx = Math.cos(g.angle);
  const fy = Math.sin(g.angle);
  ctx.fillStyle = '#ffd94d';
  ctx.fillRect(g.x + fx * 9 - 1.6, g.y + fy * 9 - 1.6, 3.2, 3.2);
  if (g.state === 'chase') {
    ctx.fillStyle = '#ff4632';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - 19 + Math.sin(time * 10) * 1.5);
  } else if (g.state === 'suspicious') {
    ctx.fillStyle = '#ffb042';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', g.x, g.y - 18);
  }
}

function drawPlayer(ctx, p, time) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 9, 8.4, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = p.moving ? Math.sin(p.stepPhase * 0.9) * 1.2 : 0;
  // Dark teal coat, hood up; a paler scarf knot toward facing.
  ctx.fillStyle = '#12556b';
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob, 9.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0d3f50';
  ctx.beginPath();
  ctx.arc(p.x, p.y + bob, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 6.4, p.y + bob + Math.sin(p.angle) * 6.4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  if (p.inShadowOrHedge) {
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(p.x, p.y + bob, 12, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---- HUD and screens -------------------------------------------------

export function drawHud(ctx, game) {
  ctx.fillStyle = 'rgba(5, 6, 14, 0.72)';
  ctx.fillRect(0, 0, WORLD_W, 30);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const { def, gems } = game.level;
  const taken = gems.filter((g) => g.taken).length;
  ctx.fillText(`${def.name} — ${def.subtitle}`, 12, 20);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#5eeaff';
  ctx.fillText(`◆ ${taken}/${gems.length}`, WORLD_W - 118, 20);
  ctx.fillStyle = '#ffd94d';
  ctx.fillText(`● coins ${game.coins}`, WORLD_W - 12, 20);
  // The loudest guard's meter, as a single eye line.
  const maxAlert = Math.max(0, ...game.guards.map((g) => g.alert));
  if (maxAlert > 0.02) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(WORLD_W / 2 - 70, 36, 140, 5);
    ctx.fillStyle = maxAlert >= 0.99 ? '#ff4632' : maxAlert >= 0.35 ? '#ffb042' : '#ffe9a8';
    ctx.fillRect(WORLD_W / 2 - 70, 36, 140 * maxAlert, 5);
  }
  // The loudest camera's meter under it, in the cameras' own colours —
  // the alarm line: fill it and every guard hears where you are.
  const maxCam = Math.max(0, ...game.cameras.map((c) => c.fill));
  if (maxCam > 0.02) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fillRect(WORLD_W / 2 - 70, 44, 140, 4);
    ctx.fillStyle = maxCam >= 0.66 ? '#ff4078' : maxCam >= 0.3 ? '#c66eff' : '#50dcff';
    ctx.fillRect(WORLD_W / 2 - 70, 44, 140 * maxCam, 4);
    ctx.fillStyle = '#9fd8e8';
    ctx.font = '600 8px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('CAM', WORLD_W / 2 - 75, 48);
  }
}

function panel(ctx, title, lines, accent = '#5eeaff') {
  ctx.fillStyle = 'rgba(4, 5, 12, 0.78)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = '700 44px Georgia, serif';
  ctx.fillText(title, WORLD_W / 2, 268);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, WORLD_W / 2, 312 + i * 26));
}

export function drawTitle(ctx, game) {
  drawWorld(ctx, game);
  ctx.fillStyle = 'rgba(4, 5, 12, 0.55)';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd94d';
  ctx.font = '700 64px Georgia, serif';
  ctx.fillText('NIGHTVAULT', WORLD_W / 2, 238);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '17px system-ui, sans-serif';
  ctx.fillText('Slip past the flashlights. Take every gem. Reach the green door unseen.', WORLD_W / 2, 282);
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#9fb4c8';
  ctx.fillText('Move: WASD / arrows · Run: Shift (loud) · Throw a coin: click · Stay in shadow and hedges', WORLD_W / 2, 322);
  ctx.fillText('A filling ring means you are being seen — break the cone before it closes.', WORLD_W / 2, 348);
  ctx.fillText('Ceiling cameras sweep on their own clocks — fill a camera\u2019s gaze and every guard hears where you stand.', WORLD_W / 2, 374);
  ctx.fillStyle = '#5eeaff';
  ctx.font = '600 18px system-ui, sans-serif';
  ctx.fillText('Press Enter or click to begin the first heist', WORLD_W / 2, 408);
}

export function drawCaught(ctx, game) {
  drawWorld(ctx, game);
  panel(ctx, 'SPOTTED', [
    `The guards of ${game.level.def.name} have you.`,
    `Gems taken: ${game.level.gems.filter((g) => g.taken).length} of ${game.level.gems.length} · Time: ${game.time.toFixed(0)}s`,
    '',
    'Press Enter or click to try the heist again',
  ], '#ff6a5e');
}

export function drawLevelClear(ctx, game) {
  drawWorld(ctx, game);
  panel(ctx, 'CLEAN GETAWAY', [
    `${game.level.def.name} is emptied — every gem gone, nobody the wiser.`,
    `Time: ${game.clearTime.toFixed(0)}s · Times fully spotted: ${game.spotted}`,
    '',
    game.levelIndex + 1 < 3 ? 'Press Enter or click for the next heist' : 'Press Enter or click for the final tally',
  ], '#3ddc97');
}

export function drawWin(ctx, game) {
  drawWorld(ctx, game);
  panel(ctx, 'THE VAULT IS EMPTY', [
    'All three heists, clean. The night shift never stood a chance.',
    `Total time: ${game.totalTime.toFixed(0)}s · Times fully spotted: ${game.spotted}`,
    '',
    'Press Enter or click to play again from the Gallery',
  ], '#ffd94d');
}
