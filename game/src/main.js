// Tideweaver: the entry point of the game.
//
// It sets up the canvas, runs the loop and draws one frame at a time. The loop steps the game at a
// fixed rate whatever the display does, so the simulation is the same on every machine, and it
// draws the board, the beam and the cards over it.

import { STEP, VIEW } from './config.js';
import { click, createGame, currentCard, loadLevel, restartLevel, startRun, step } from './game.js';
import { bindInput } from './input.js';
import { stageShot } from './shots.js';
import {
  SCREEN_PLAY,
  SCREEN_TITLE,
  drawBackdrop,
  drawBeam,
  drawBoard,
  drawHud,
  drawCard,
  drawTiles,
  drawTitle,
} from './render.js';

const canvas = document.getElementById('game');
const context = canvas.getContext('2d');
const game = createGame();
loadLevel(game, 0);

// A shot request sets the game up for a known scene, so a screenshot can be taken of it.
const shot = new URLSearchParams(window.location.search).get('shot');
if (shot) {
  stageShot(shot, game);
}

/** Size the canvas's backing store to the window's pixels, so the drawing stays sharp. */
function resize() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(window.innerWidth * ratio);
  canvas.height = Math.floor(window.innerHeight * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

/** Scale the logical area into the window, letterboxed, and clear the rest. */
function prepareFrame() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const scale = Math.min(width / VIEW.width, height / VIEW.height);
  const offsetX = (width - VIEW.width * scale) / 2;
  const offsetY = (height - VIEW.height * scale) / 2;
  context.setTransform(window.devicePixelRatio || 1, 0, 0, window.devicePixelRatio || 1, 0, 0);
  context.fillStyle = '#04121c';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.setTransform(
    (window.devicePixelRatio || 1) * scale,
    0,
    0,
    (window.devicePixelRatio || 1) * scale,
    offsetX * (window.devicePixelRatio || 1),
    offsetY * (window.devicePixelRatio || 1),
  );
}

/** Draw everything of the current frame. */
function draw(time) {
  prepareFrame();
  drawBackdrop(context, time);
  if (game.screen === SCREEN_TITLE) {
    drawTitle(context, game, time);
    return;
  }
  drawBoard(context, game.level, time);
  drawBeam(context, game.level, game.segments, game.glow);
  drawTiles(context, game.level, time);
  drawHud(context, game);
  const card = currentCard(game);
  if (card) drawCard(context, card);
}

bindInput(canvas, game, {
  click: (x, y) => click(game, x, y),
  restart: () => restartLevel(game),
});

window.addEventListener('resize', resize);
resize();

let last = performance.now();
let accumulator = 0;

function frame(now) {
  const elapsed = Math.min((now - last) / 1000, 0.25);
  last = now;
  accumulator += elapsed;
  // A shot request shows one fixed moment, so the simulation is held still while it is drawn.
  if (!shot) {
    while (accumulator >= STEP) {
      step(game, STEP);
      accumulator -= STEP;
    }
  }
  draw(now / 1000);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// The title screen is the first thing the player sees, so the game starts there, unless a shot
// was asked for.
if (!shot) game.screen = SCREEN_TITLE;
