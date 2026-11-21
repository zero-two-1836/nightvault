// Nightvault — the three heists, as tile maps plus guard patrols.
//
// Tile legend:
//   #  wall            .  marble floor      ,  shadow carpet (hides you a little)
//   B  hedge (hides you a lot)              C  crate (solid, blocks sight)
//   =  glass case (solid, blocks sight)     G  gem (steal every one)
//   E  exit door (opens once every gem is gone)   P  your way in
//
// Rows are padded to the full width with wall when loaded, so a short row
// can never break the level. Guard patrols are waypoint loops in tile
// coordinates; guards pause at each end and sweep their flashlight.

export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;

const L = (name, subtitle, coins, map, guards) => ({ name, subtitle, coins, map, guards });

export const LEVELS = [
  L(
    'The Gallery',
    'Two guards. Two gems. Learn the cones.',
    2,
    [
      '##############################',
      '#P......#..........#.........#',
      '#.......#....,,....#....G....#',
      '#.......#...,,,,...#.........#',
      '#..CC...#....,,....#....==...#',
      '#.......#..........#.........#',
      '#.......#####..#####.........#',
      '#............................#',
      '#....,,..........,,......C...#',
      '#...,,,,...##...,,,,.........#',
      '#....,,....##....,,..........#',
      '#............................#',
      '#.......#####..#####....G....#',
      '#.......#..........#.........#',
      '#..==...#....,,....#....CC...#',
      '#.......#...,,,,...#.........#',
      '#.......#....,,....#.........#',
      '#.......#..........#.....E...#',
      '#.......#..........#.........#',
      '##############################',
    ],
    [
      { path: [[6, 15], [6, 3], [6, 11], [13, 11], [13, 8], [13, 11], [6, 11]], speed: 52, pause: 1.4 },
      { path: [[22, 3], [27, 3], [27, 10], [22, 10], [22, 3]], speed: 58, pause: 1.1 },
    ],
  ),
  L(
    'The Vault Floor',
    'Crossing patrols. Cases everywhere. Stay low, stay dark.',
    3,
    [
      '##############################',
      '#P.....#........#.......#...G#',
      '#......#...G....#.......#....#',
      '#..==..#........#...=...#....#',
      '#......#...,,...#.......#....#',
      '#......#..,,,,..#####...#....#',
      '#..C...#...,,.......#...#....#',
      '#......####..####...#...#....#',
      '#.......................#....#',
      '####..####...####...#...####.#',
      '#...................#........#',
      '#....,,......C......#...,,...#',
      '#...,,,,................,,..#',
      '#....,,....####.....#...,,...#',
      '#..........####.....#........#',
      '#..G....C..####..C..#....E...#',
      '#..........####.....#........#',
      '#....,,....####.....#....,,..#',
      '#..........####.....#........#',
      '##############################',
    ],
    [
      { path: [[4, 10], [15, 10], [18, 10], [18, 16], [18, 10], [10, 10], [10, 16], [4, 16]], speed: 62, pause: 1.0 },
      { path: [[12, 3], [12, 8], [21, 8], [21, 3], [21, 8], [12, 8]], speed: 66, pause: 0.8 },
      { path: [[26, 10], [26, 17], [23, 17], [23, 10], [26, 10]], speed: 60, pause: 1.2 },
    ],
  ),
  L(
    'The Rooftop Garden',
    'Hedges hide you — if you reach them. Four guards, one way out.',
    3,
    [
      '##############################',
      '#P..B......#..........#.....G#',
      '#...BB.....#....G.....#......#',
      '#..BBBB....#..........#..BB..#',
      '#...BB.....#####..#####..BB..#',
      '#....B.......................#',
      '#..........##..##......B.....#',
      '#..,,......#....#.....BBB....#',
      '#.,,,,.....#....#......B.....#',
      '#..,,......##..##............#',
      '#....................##..##..#',
      '#.....B.......C......#....#..#',
      '#....BBB.............#....#..#',
      '#.....B......,,......##..##..#',
      '#...........,,,,.............#',
      '#..G........,,,,......C......#',
      '#......##...........##.......#',
      '#......##....,,.....##...E...#',
      '#............,,..............#',
      '##############################',
    ],
    [
      { path: [[6, 5], [13, 5], [13, 12], [6, 12], [6, 5]], speed: 64, pause: 0.9 },
      { path: [[20, 1], [20, 2], [17, 2], [17, 8], [20, 8], [17, 8], [17, 1]], speed: 68, pause: 0.8 },
      { path: [[23, 12], [25, 12], [23, 12], [23, 17], [25, 17], [23, 17]], speed: 62, pause: 1.0 },
      { path: [[11, 15], [18, 15], [18, 18], [11, 18], [11, 15]], speed: 70, pause: 0.7 },
    ],
  ),
];

// Turn a level's raw rows into a padded grid plus the things standing on it.
export function buildLevel(index) {
  const def = LEVELS[index];
  const grid = [];
  let start = { x: 48, y: 48 };
  const gems = [];
  let exit = null;
  for (let y = 0; y < ROWS; y++) {
    const row = (def.map[y] ?? '').padEnd(COLS, '#').slice(0, COLS);
    grid.push(row.split(''));
    for (let x = 0; x < COLS; x++) {
      const c = row[x];
      const px = x * TILE + TILE / 2;
      const py = y * TILE + TILE / 2;
      if (c === 'P') start = { x: px, y: py };
      if (c === 'G') gems.push({ x: px, y: py, taken: false, bob: Math.random() * 6 });
      if (c === 'E') exit = { x: px, y: py, tx: x, ty: y };
    }
  }
  return { def, grid, start, gems, exit, coinsLeft: def.coins };
}

export const SOLID = new Set(['#', 'C', '=']);
export const BLOCKS_SIGHT = new Set(['#', 'C', '=']);

export function tileAt(grid, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
  return grid[ty][tx];
}

export function isSolid(grid, tx, ty) {
  return SOLID.has(tileAt(grid, tx, ty));
}

export function blocksSight(grid, tx, ty) {
  return BLOCKS_SIGHT.has(tileAt(grid, tx, ty));
}

// Circle-versus-grid collision: try each axis on its own so the mover
// slides along walls instead of sticking to them.
export function moveCircle(grid, pos, dx, dy, r) {
  const hits = (x, y) =>
    isSolid(grid, Math.floor((x - r) / TILE), Math.floor(y / TILE)) ||
    isSolid(grid, Math.floor((x + r) / TILE), Math.floor(y / TILE)) ||
    isSolid(grid, Math.floor(x / TILE), Math.floor((y - r) / TILE)) ||
    isSolid(grid, Math.floor(x / TILE), Math.floor((y + r) / TILE)) ||
    isSolid(grid, Math.floor((x - r) / TILE), Math.floor((y - r) / TILE)) ||
    isSolid(grid, Math.floor((x + r) / TILE), Math.floor((y - r) / TILE)) ||
    isSolid(grid, Math.floor((x - r) / TILE), Math.floor((y + r) / TILE)) ||
    isSolid(grid, Math.floor((x + r) / TILE), Math.floor((y + r) / TILE));
  if (!hits(pos.x + dx, pos.y)) pos.x += dx;
  if (!hits(pos.x, pos.y + dy)) pos.y += dy;
  return pos;
}
