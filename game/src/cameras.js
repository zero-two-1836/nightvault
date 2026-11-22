// Nightvault — the cameras. Every hall worth robbing is watched by a
// ceiling dome on a slow clock: it sweeps its gaze back and forth across
// a fixed arc, and while you stand in that gaze its own meter fills —
// slower in shadow, not at all inside a hedge it cannot see into. Fill it
// and the alarm trips: every guard on the floor hears exactly where you
// are standing and comes to look. Slip out of the beam and the meter
// drains, so a camera is a timing puzzle, never a wall: cross behind its
// sweep, or cross fast and take the suspicion on the chin.
//
// Cameras differ from guards in the ways that matter. They never move,
// never chase and never forget on their own schedule — the sweep is the
// patrol, and it can be learned to the second.

import { TILE, tileAt } from './levels.js';
import { angleWrap, lineOfSight } from './vision.js';

export const CAM_RANGE = 126;
export const CAM_HALF_ANGLE = 0.5; // ~29 degrees each side
export const CAM_SPOT_HEDGE_RANGE = 42;

export class Camera {
  constructor(def) {
    this.x = def.x * TILE + TILE / 2;
    this.y = def.y * TILE + TILE / 2;
    this.center = def.angle; // the middle of the sweep, in radians
    this.sweep = def.sweep ?? 0.8; // how far either side of centre it looks
    this.speed = def.speed ?? 0.45; // sweep cycles per second, roughly
    this.phase = def.phase ?? 0;
    this.angle = this.center;
    this.fill = 0; // 0 calm .. 1 the alarm trips
    this.frozen = false; // screenshot scenes pose the angle by hand
  }

  // The sweep is a plain sine of game time, so a player who watches two
  // cycles knows the third — and a posed screenshot angle stays posed.
  update(time) {
    if (this.frozen) return;
    this.angle = this.center + Math.sin(time * this.speed * Math.PI + this.phase) * this.sweep;
  }
}

// One camera looking at the player: the same cone, line of sight and
// cover rules as a guard's flashlight, with a camera's own numbers —
// a touch shorter sight, a touch slower fill, no ears at all.
export function senseCamera(grid, cam, player) {
  const dx = player.x - cam.x;
  const dy = player.y - cam.y;
  const dist = Math.hypot(dx, dy);
  const under = tileAt(grid, Math.floor(player.x / TILE), Math.floor(player.y / TILE));
  const inHedge = under === 'B';

  if (inHedge && dist > CAM_SPOT_HEDGE_RANGE) return { seen: false, rate: 0 };
  if (dist > CAM_RANGE) return { seen: false, rate: 0 };

  const facing = Math.atan2(dy, dx);
  if (Math.abs(angleWrap(facing - cam.angle)) > CAM_HALF_ANGLE) return { seen: false, rate: 0 };
  if (!lineOfSight(grid, cam.x, cam.y, player.x, player.y)) return { seen: false, rate: 0 };

  let rate = 1.55 - 0.95 * (dist / CAM_RANGE);
  if (under === ',') rate *= 0.5; // shadow carpet dulls the lens too
  if (inHedge) rate *= 0.55;
  if (player.running) rate *= 1.4;
  if (!player.moving) rate *= 0.85;
  return { seen: true, rate };
}

// Step every camera on the floor. Returns true on the frame the alarm
// trips, so the caller can raise the noise and flash the lights.
export function updateCameras(game, dt, events) {
  let tripped = false;
  for (const cam of game.cameras) {
    cam.update(game.time);
    const sense = senseCamera(game.level.grid, cam, game.player);
    if (sense.seen) {
      cam.fill = Math.min(1, cam.fill + sense.rate * dt);
    } else {
      cam.fill = Math.max(0, cam.fill - 0.28 * dt);
    }
    if (cam.fill >= 1) {
      cam.fill = 0.3; // the alarm spends the meter; it must earn it back
      tripped = true;
      events.push('alarm');
      events.push('camera-alarm');
    }
  }
  return tripped;
}
