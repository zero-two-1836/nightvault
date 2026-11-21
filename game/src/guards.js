// Nightvault — the guards. Each one walks a waypoint loop, pauses at the
// ends to sweep its flashlight, and runs a simple state machine:
//
//   patrol      walk the loop, meter drains
//   suspicious  something filled the meter partway, or a noise rang out:
//               go and look at the spot, stare, then give up
//   chase       the meter filled: run at the player while you can see
//               them, remember the last place you saw them
//   return      walk back to the loop and pick the patrol up again
//
// The meter is the game's mercy: it fills over a second or so, faster up
// close, and a player who breaks the cone early only leaves a guard
// curious, never certain. That is the chance to recover.

import { TILE, moveCircle } from './levels.js';
import { angleLerp, angleWrap, sensePlayer } from './vision.js';

const SUSPICIOUS_AT = 0.35;
const CHASE_AT = 1;
const LOSE_SIGHT_AFTER = 3.2;
const CATCH_DIST = 21;

export class Guard {
  constructor(def, grid) {
    this.grid = grid;
    this.path = def.path.map(([tx, ty]) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 }));
    this.speed = def.speed;
    this.pauseTime = def.pause;
    this.x = this.path[0].x;
    this.y = this.path[0].y;
    this.wp = 1 % this.path.length;
    this.angle = Math.atan2(this.path[this.wp].y - this.y, this.path[this.wp].x - this.x);
    this.state = 'patrol';
    this.alert = 0;
    this.pauseLeft = 0;
    this.sweepPhase = Math.random() * 6;
    this.target = null; // point of interest for suspicious / chase memory
    this.sightLostFor = 0;
    this.stareLeft = 0;
    this.stepPhase = Math.random() * 6;
  }

  get speedNow() {
    if (this.state === 'chase') return this.speed * 1.9;
    if (this.state === 'suspicious' || this.state === 'return') return this.speed * 1.35;
    return this.speed;
  }

  // A coin clink or loud footsteps: guards in earshot come and look.
  hear(x, y) {
    if (this.state === 'chase') return;
    this.alert = Math.max(this.alert, 0.55);
    this.state = 'suspicious';
    this.target = { x, y };
    this.stareLeft = 0;
  }

  walkToward(dt, tx, ty, arriveDist = 6) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= arriveDist) return true;
    const want = Math.atan2(dy, dx);
    this.angle = angleLerp(this.angle, want, Math.min(1, dt * 7));
    const step = Math.min(dist, this.speedNow * dt);
    moveCircle(this.grid, this, Math.cos(want) * step, Math.sin(want) * step, 11);
    this.stepPhase += dt * this.speedNow * 0.09;
    return false;
  }

  update(dt, player, events) {
    const sense = sensePlayer(this.grid, this, player);

    if (sense.seen) {
      this.alert = Math.min(1, this.alert + sense.rate * dt);
      this.sightLostFor = 0;
      this.target = { x: player.x, y: player.y };
      if (this.alert >= CHASE_AT && this.state !== 'chase') {
        this.state = 'chase';
        events.push('alarm');
      } else if (this.alert >= SUSPICIOUS_AT && this.state === 'patrol') {
        this.state = 'suspicious';
      }
    } else {
      this.sightLostFor += dt;
      const drain = this.state === 'chase' ? 0.1 : 0.22;
      this.alert = Math.max(0, this.alert - drain * dt);
    }

    if (this.state === 'chase') {
      if (sense.seen || this.sightLostFor < 0.4) {
        this.walkToward(dt, player.x, player.y, 0);
      } else if (this.target && this.walkToward(dt, this.target.x, this.target.y, 10)) {
        this.stareLeft = 1.1; // arrived at the last sighting: look around
        this.state = 'suspicious';
      }
      if (this.sightLostFor > LOSE_SIGHT_AFTER) {
        this.state = 'suspicious';
        this.stareLeft = 1.1;
      }
      const d = Math.hypot(player.x - this.x, player.y - this.y);
      if (d < CATCH_DIST) events.push('caught');
      return;
    }

    if (this.state === 'suspicious') {
      if (this.stareLeft > 0) {
        this.stareLeft -= dt;
        this.angle += Math.sin(this.sweepPhase + performance.now() / 480) * dt * 0.9;
        if (this.stareLeft <= 0 && this.alert < SUSPICIOUS_AT) this.state = 'return';
      } else if (this.target) {
        if (this.walkToward(dt, this.target.x, this.target.y, 12)) this.stareLeft = 1.3;
      } else {
        this.state = 'return';
      }
      if (this.alert < 0.05 && this.stareLeft <= 0) this.state = 'return';
      return;
    }

    if (this.state === 'return') {
      const post = this.path[this.wp];
      if (this.walkToward(dt, post.x, post.y, 8)) this.state = 'patrol';
      return;
    }

    // patrol
    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      // A slow flashlight sweep while standing post.
      this.angle += Math.sin(performance.now() / 620 + this.sweepPhase) * dt * 0.7;
      return;
    }
    const post = this.path[this.wp];
    if (this.walkToward(dt, post.x, post.y, 6)) {
      this.wp = (this.wp + 1) % this.path.length;
      this.pauseLeft = this.pauseTime;
    }
  }
}

export function anyGuardHears(guards, x, y, radius) {
  for (const g of guards) {
    if (Math.hypot(g.x - x, g.y - y) <= radius) g.hear(x, y);
  }
}
