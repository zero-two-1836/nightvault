// Nightvault — the game itself: state machine, loop, and glue.
//
// States: title -> playing -> caught / clear -> (next level) -> win.
// While playing, every frame moves the player, steps the guards, throws
// and lands coins, listens for loud footsteps, and checks the gems and
// the exit. The exit only counts once every gem is taken.
//
// Screenshot scenes: ?shot=cover|sneak|alert|clear poses a real,
// deterministic moment of the game (same code paths, scripted places)
// so the entry's screenshots are honest renders of the game running.
// In a shot scene the world is held still — only the idle animations
// (gem bob, cone shimmer) advance — so the posed moment is what renders.

import { buildLevel, TILE } from './levels.js';
import { Guard, anyGuardHears } from './guards.js';
import { Player, Coin, RUN_NOISE_RADIUS, COIN_THROW_RANGE } from './player.js';
import { createInput, WORLD_W, WORLD_H } from './input.js';
import { drawWorld, drawHud, drawTitle, drawCaught, drawLevelClear, drawWin } from './render.js';
import { Sound } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const sound = new Sound();

const params = new URLSearchParams(location.search);
const shot = params.get('shot');

const game = {
  state: 'title',
  levelIndex: 0,
  level: null,
  guards: [],
  player: null,
  coin: null,
  coins: 0,
  time: 0,
  clearTime: 0,
  totalTime: 0,
  spotted: 0,
  guardStepAt: 0,
};

function loadLevel(index) {
  game.levelIndex = index;
  game.level = buildLevel(index);
  game.player = new Player(game.level.start);
  game.guards = game.level.def.guards.map((def) => new Guard(def, game.level.grid));
  game.coin = null;
  game.coins = game.level.coinsLeft;
  game.time = 0;
  game.state = 'playing';
}

function restart() {
  game.totalTime = 0;
  game.spotted = 0;
  loadLevel(0);
}

// Gem pickup and the exit are checked on positions, not tiles, so brushing
// the pedestal counts and the door needs a real arrival.
function checkObjectives(events) {
  const p = game.player;
  for (const gem of game.level.gems) {
    if (!gem.taken && Math.hypot(gem.x - p.x, gem.y - p.y) < 20) {
      gem.taken = true;
      sound.gem();
    }
  }
  const e = game.level.exit;
  if (e && game.level.gems.every((g) => g.taken)) {
    if (Math.abs(p.x - e.x) < 18 && Math.abs(p.y - e.y) < 18) {
      game.clearTime = game.time;
      game.totalTime += game.time;
      game.state = game.levelIndex + 1 >= 3 ? 'win' : 'clear';
      sound.getaway();
    }
  }
}

function step(dt) {
  const events = [];
  const footstep = game.player.update(dt, game.level.grid, input.keys);
  if (footstep) {
    sound.footstep(footstep.loud, footstep.side);
    if (footstep.loud) anyGuardHears(game.guards, footstep.x, footstep.y, RUN_NOISE_RADIUS);
  }

  // Coin tosses: a click throws toward the mouse, if a coin is left and
  // the spot is within throwing range.
  while (input.clicks.length) {
    const click = input.clicks.shift();
    sound.ensure();
    if (game.coins <= 0 || game.coin) continue;
    const d = Math.hypot(click.x - game.player.x, click.y - game.player.y);
    if (d > COIN_THROW_RANGE || d < 12) continue;
    game.coin = new Coin(game.player.x, game.player.y, click.x, click.y);
    game.coins -= 1;
  }
  if (game.coin) {
    game.coin.update(dt);
    if (game.coin.landed && !game.coin.clinked) {
      game.coin.clinked = true;
      sound.coinClink();
      anyGuardHears(game.guards, game.coin.x, game.coin.y, 170);
      setTimeout(() => { if (game.coin && game.coin.clinked) game.coin = null; }, 900);
    }
  }

  const wasChasing = game.guards.some((g) => g.state === 'chase');
  for (const g of game.guards) g.update(dt, game.player, events);
  const nowChasing = game.guards.some((g) => g.state === 'chase');
  if (nowChasing && !wasChasing) game.spotted += 1;
  if (events.includes('alarm')) sound.alarm();
  if (events.includes('caught')) {
    game.state = 'caught';
    sound.caught();
    return;
  }

  // Guard footsteps on a shared timer: quiet patter that swells as a
  // guard comes near, so your ears map the patrols too.
  game.guardStepAt -= dt;
  if (game.guardStepAt <= 0) {
    game.guardStepAt = 0.34;
    const nearest = Math.min(...game.guards.map((g) => Math.hypot(g.x - game.player.x, g.y - game.player.y)));
    if (nearest < 190) sound.guardStep();
  }

  game.time += dt;
  checkObjectives(events);
}

function draw() {
  if (game.state === 'title') return drawTitle(ctx, game);
  if (game.state === 'caught') return drawCaught(ctx, game);
  if (game.state === 'clear') return drawLevelClear(ctx, game);
  if (game.state === 'win') return drawWin(ctx, game);
  drawWorld(ctx, game);
  drawHud(ctx, game);
  // Aim hint: a faint ring where a click would land a coin.
  if (game.coins > 0 && !game.coin) {
    ctx.strokeStyle = 'rgba(255, 217, 77, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(input.mouse.x, input.mouse.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ---- screenshot scenes -------------------------------------------------
// Each scene loads a level and poses a genuine mid-game moment with the
// real classes, then lets the normal loop run: cones sweep, gems bob.
// Positions were chosen on the level maps to read at a glance.

function poseShot(name) {
  if (name === 'cover') {
    loadLevel(0);
    game.state = 'title';
    game.player.x = 3.5 * TILE; game.player.y = 9.5 * TILE;
    game.guards[0].x = 15.5 * TILE; game.guards[0].y = 7.5 * TILE; game.guards[0].angle = 0.4;
    game.guards[1].x = 24 * TILE; game.guards[1].y = 7.5 * TILE; game.guards[1].angle = 2.6;
    return;
  }
  if (name === 'sneak') {
    loadLevel(0);
    // You, in the shadow carpet of the west hall, a coin mid-flight,
    // one guard's cone sweeping past the carpet's edge.
    game.player.x = 11.5 * TILE; game.player.y = 3.4 * TILE;
    game.player.angle = 0.2;
    game.guards[0].x = 13.6 * TILE; game.guards[0].y = 7.4 * TILE;
    game.guards[0].angle = -1.9; game.guards[0].alert = 0.52; game.guards[0].state = 'suspicious';
    game.coin = new Coin(game.player.x, game.player.y, 17.5 * TILE, 2.5 * TILE);
    game.coin.t = 0.55; game.coin.update(0.001);
    game.coins = 1;
    return;
  }
  if (name === 'alert') {
    loadLevel(1);
    // Caught in the open on the vault floor: full meter, red cone, chase.
    game.player.x = 12.5 * TILE; game.player.y = 12.4 * TILE;
    game.player.angle = 2.8; game.player.moving = true; game.player.running = true;
    const g = game.guards[0];
    g.x = 10.6 * TILE; g.y = 10.8 * TILE; g.angle = 0.65;
    g.alert = 1; g.state = 'chase';
    game.level.gems[1].taken = true;
    return;
  }
  if (name === 'clear') {
    loadLevel(2);
    for (const gem of game.level.gems) gem.taken = true;
    game.player.x = game.level.exit.x - TILE * 1.4;
    game.player.y = game.level.exit.y;
    game.player.angle = 0;
    game.clearTime = 96;
    game.totalTime = 402;
    game.spotted = 2;
    game.state = 'clear';
    return;
  }
  loadLevel(0);
  game.state = 'title';
}

if (shot) poseShot(shot);
else loadLevel(0), game.state = 'title';

document.addEventListener('nightvault-mute', () => {
  sound.ensure();
  sound.muted = !sound.muted;
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (shot) {
    game.time += dt;
  } else if (game.state === 'playing') step(dt);
  else if (game.state === 'title') {
    // The title idles over a live level: guards keep their patrols.
    const events = [];
    for (const g of game.guards) g.update(dt, { x: -999, y: -999, running: false, moving: false }, events);
    game.time += dt;
  } else {
    game.time += dt;
  }
  if (input.takeConfirm()) {
    sound.ensure();
    if (game.state === 'title') loadLevel(0);
    else if (game.state === 'caught') loadLevel(game.levelIndex);
    else if (game.state === 'clear') loadLevel(game.levelIndex + 1);
    else if (game.state === 'win') restart();
  }
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
