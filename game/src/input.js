// Nightvault — hands. Keyboard state for movement and actions, and the
// mouse: its position in world coordinates (for aiming a coin toss) and a
// queue of clicks. The canvas is fixed at 960x640 and CSS scales it, so
// mouse coordinates are unscaled back through the bounding rect.

export const WORLD_W = 960;
export const WORLD_H = 640;

export function createInput(canvas) {
  const keys = { left: false, right: false, up: false, down: false, run: false };
  const mouse = { x: 0, y: 0 };
  const clicks = [];
  let confirmPressed = false;

  const set = (code, down) => {
    if (code === 'ArrowLeft' || code === 'KeyA') keys.left = down;
    else if (code === 'ArrowRight' || code === 'KeyD') keys.right = down;
    else if (code === 'ArrowUp' || code === 'KeyW') keys.up = down;
    else if (code === 'ArrowDown' || code === 'KeyS') keys.down = down;
    else if (code === 'ShiftLeft' || code === 'ShiftRight') keys.run = down;
    else if ((code === 'Enter' || code === 'Space') && down) confirmPressed = true;
  };

  addEventListener('keydown', (e) => {
    if (e.code.startsWith('Arrow')) e.preventDefault();
    set(e.code, true);
  });
  addEventListener('keyup', (e) => set(e.code, false));

  const toWorld = (e) => {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * WORLD_W,
      y: ((e.clientY - r.top) / r.height) * WORLD_H,
    };
  };
  canvas.addEventListener('mousemove', (e) => Object.assign(mouse, toWorld(e)));
  canvas.addEventListener('mousedown', (e) => {
    const p = toWorld(e);
    clicks.push(p);
    confirmPressed = true;
  });

  return {
    keys,
    mouse,
    clicks,
    takeConfirm() {
      const c = confirmPressed;
      confirmPressed = false;
      return c;
    },
  };
}
