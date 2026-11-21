// Nightvault — you. A small figure in a dark coat who walks quietly,
// runs loudly, and carries a pocketful of coins for throwing. Movement is
// arrows or WASD; holding Shift runs (faster, but your steps carry and
// guards notice movement sooner); a mouse click tosses a coin to that
// spot, and its clink pulls nearby guards away to look at nothing.

import { moveCircle } from './levels.js';
import { tileUnder } from './vision.js';

export const WALK_SPEED = 118;
export const RUN_SPEED = 196;
export const RUN_NOISE_RADIUS = 96;
export const COIN_THROW_RANGE = 280;

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.moving = false;
    this.running = false;
    this.stepPhase = 0;
    this.stepSide = 1; // alternates: feeds the footstep sounds
  }

  get inShadowOrHedge() {
    return this.tile === ',' || this.tile === 'B';
  }

  update(dt, grid, keys) {
    this.tile = tileUnder(grid, this.x, this.y);
    let dx = 0;
    let dy = 0;
    if (keys.left) dx -= 1;
    if (keys.right) dx += 1;
    if (keys.up) dy -= 1;
    if (keys.down) dy += 1;
    this.moving = dx !== 0 || dy !== 0;
    this.running = this.moving && keys.run;
    if (!this.moving) return null;

    const len = Math.hypot(dx, dy);
    const speed = this.running ? RUN_SPEED : WALK_SPEED;
    const vx = (dx / len) * speed * dt;
    const vy = (dy / len) * speed * dt;
    this.angle = Math.atan2(dy, dx);
    moveCircle(grid, this, vx, vy, 10);
    this.stepPhase += dt * speed;
    // A footstep event every stride, so main can make noise (and sound).
    if (this.stepPhase > (this.running ? 34 : 30)) {
      this.stepPhase = 0;
      this.stepSide *= -1;
      return { x: this.x, y: this.y, loud: this.running, side: this.stepSide };
    }
    return null;
  }
}

// A thrown coin: flies to the clicked point, lands, and clinks once.
export class Coin {
  constructor(fromX, fromY, toX, toY) {
    this.x = fromX;
    this.y = fromY;
    this.fromX = fromX;
    this.fromY = fromY;
    this.toX = toX;
    this.toY = toY;
    this.t = 0;
    this.landed = false;
    this.clinked = false;
  }

  update(dt) {
    if (this.landed) return;
    this.t += dt / 0.45;
    const t = Math.min(1, this.t);
    this.x = this.fromX + (this.toX - this.fromX) * t;
    this.y = this.fromY + (this.toY - this.fromY) * t;
    if (t >= 1) this.landed = true;
  }

  get height() {
    return Math.sin(Math.min(1, this.t) * Math.PI) * 14;
  }
}
