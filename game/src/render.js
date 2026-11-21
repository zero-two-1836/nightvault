// Nightvault — drawing. Everything is painted on one canvas in code:
// marble floors and gold trim, indigo shadow carpets, hedges, crates and
// glass cases for cover, and the flashlight cones — warm white when a
// guard is calm, amber as its meter fills, red on the chase. The cones are
// clipped by walls, so what is lit is exactly what is seen.

import { TILE, COLS, ROWS } from './levels.js';
import { CONE_RANGE, CONE_HALF_ANGLE, lineOfSight } from './vision.js';
import { WORLD_W, WORLD_H } from './input.js';

const INK = '#0b0e1a';

function conePolygon(ctx, grid, guard) {
  // Fan of rays across the cone; each ray stops where sight stops.
  const steps = 26;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (let i = 0; i <= steps; i++) {
    const a = guard.angle - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / steps;
    let r = CONE_RANGE;
    // Binary-search the wall distance along this ray.
    let lo = 0;
    let hi = CONE_RANGE;
    for (let k = 0; k < 12; k++) {
      const mid = (lo + hi) / 2;
      const px = guard.x + Math.cos(a) * mid;
      const py = guard.y + Math.sin(a) * mid;
      if (lineOfSight(grid, guard.x, guard.y, px, py)) lo = mid;
      else hi = mid;
    }
    r = lo;
    ctx.lineTo(guard.x + Math.cos(a) * r, guard.y + Math.sin(a) * r);
  }
  ctx.closePath();
}

function coneColor(alert, alpha) {
  if (alert >= 0.99) return `rgba(255, 70, 50, ${alpha})`;
  if (alert >= 0.35) return `rgba(255, 176, 66, ${alpha})`;
  return `rgba(255, 240, 190, ${alpha})`;
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
        continue;
      }
      // Marble checker, dim so the cones read against it.
      ctx.fillStyle = (x + y) % 2 === 0 ? '#171b30' : '#141828';
      ctx.fillRect(px, py, TILE, TILE);
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

  // Flashlight cones, additively over the dark floor.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const g of game.guards) {
    conePolygon(ctx, grid, g);
    const grad = ctx.createRadialGradient(g.x, g.y, 4, g.x, g.y, CONE_RANGE);
    grad.addColorStop(0, coneColor(g.alert, 0.34));
    grad.addColorStop(1, coneColor(g.alert, 0.02));
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();

  if (game.coin) drawCoin(ctx, game.coin);
  for (const g of game.guards) drawGuard(ctx, g, game.time);
  drawPlayer(ctx, game.player, game.time);
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
    ctx.fillStyle = 'rgba(61, 220, 151, 0.16)';
    ctx.fillRect(px - 6, py - 6, TILE + 12, TILE + 12);
  }
}

function drawGem(ctx, gem, time) {
  const bob = Math.sin(time * 2.4 + gem.bob) * 2.5;
  const y = gem.y + bob;
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
