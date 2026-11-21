// Nightvault — seeing. A guard sees with a flashlight cone: a range, a
// half-angle around the way it faces, and a clear line of sight that walls,
// crates and glass cases interrupt. Shadow carpet slows the fill of the
// detection meter; a hedge swallows you whole unless a guard is close
// enough to spot your shoes.

import { TILE, blocksSight, tileAt } from './levels.js';

export const CONE_RANGE = 132;
export const CONE_HALF_ANGLE = 0.56; // ~32 degrees each side
export const HEDGE_SPOT_RANGE = 50;

export function angleWrap(a) {
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

export function angleLerp(a, b, t) {
  return a + angleWrap(b - a) * t;
}

// March the grid cell by cell from (x0, y0) to (x1, y1); sight stops at the
// first cell that blocks it. Steps of a quarter tile are fine at this scale
// and cheap enough to run for every guard every frame.
export function lineOfSight(grid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / (TILE / 4)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(grid, tx, ty)) return false;
  }
  return true;
}

export function tileUnder(grid, x, y) {
  return tileAt(grid, Math.floor(x / TILE), Math.floor(y / TILE));
}

// Everything about one guard looking at the player, in one place:
// whether the player is in the cone at all, and how fast the meter fills
// (per second) given distance, light and what the player is doing.
export function sensePlayer(grid, guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  const under = tileUnder(grid, player.x, player.y);
  const inHedge = under === 'B';

  if (inHedge && dist > HEDGE_SPOT_RANGE) return { seen: false, rate: 0, dist };
  if (dist > CONE_RANGE) return { seen: false, rate: 0, dist };

  const facing = Math.atan2(dy, dx);
  if (Math.abs(angleWrap(facing - guard.angle)) > CONE_HALF_ANGLE) {
    return { seen: false, rate: 0, dist };
  }
  if (!lineOfSight(grid, guard.x, guard.y, player.x, player.y)) {
    return { seen: false, rate: 0, dist };
  }

  // Closer fills faster; the last stretch of the cone barely registers.
  let rate = 1.9 - 1.15 * (dist / CONE_RANGE);
  if (under === ',') rate *= 0.45; // shadow carpet
  if (inHedge) rate *= 0.6; // half-spotted through the leaves
  if (player.running) rate *= 1.5;
  if (!player.moving) rate *= 0.8;
  return { seen: true, rate, dist };
}
