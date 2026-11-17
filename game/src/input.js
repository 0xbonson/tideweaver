// The input: the mouse, the keyboard and the touch, all turned into the clicks and keys the game
// understands.
//
// The board is drawn on a canvas that is scaled to the window, so a click's position in the page
// has to be taken back to the game's logical grid before a mirror can be found under it.

import { BOARD, CELL, VIEW } from './config.js';
import { boardOrigin } from './render.js';

/**
 * The grid cell under a point in the page, or null when the point is outside the board.
 *
 * The canvas fills the window and the logical area is scaled to fit it, so the page's pixels are
 * turned back into logical pixels first.
 */
export function cellAt(game, pageX, pageY, canvas) {
  const bounds = canvas.getBoundingClientRect();
  const scale = Math.min(bounds.width / VIEW.width, bounds.height / VIEW.height);
  const offsetX = (bounds.width - VIEW.width * scale) / 2;
  const offsetY = (bounds.height - VIEW.height * scale) / 2;
  const x = (pageX - bounds.left - offsetX) / scale;
  const y = (pageY - bounds.top - offsetY) / scale;
  const origin = boardOrigin(game.level);
  const column = Math.floor((x - origin.x) / CELL);
  const row = Math.floor((y - origin.y) / CELL);
  if (column < 0 || row < 0 || column >= game.level.width || row >= game.level.height) return null;
  return { x: column, y: row };
}

/** Wire the page's events to the game: a click, a restart key and a touch. */
export function bindInput(canvas, game, handlers) {
  const onPointer = (event) => {
    const cell = cellAt(game, event.clientX, event.clientY, canvas);
    handlers.click(cell ? cell.x : -1, cell ? cell.y : -1);
  };

  canvas.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    onPointer(event);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'r' || event.key === 'R') handlers.restart();
    if (event.key === 'Enter' || event.key === ' ') handlers.click(-1, -1);
  });
}
