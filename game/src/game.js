// The game: what is on screen, what a click does, and how a run is scored.
//
// The state machine has five screens: the title, play, the level-clear card, the failed card and
// the run's end. A run is ten levels; each one asks for the fewest turns of the mirrors there is,
// so the par is the best score and beating it is the challenge.

import { CLEAR_POINTS, MOVE_COST, PEARL_POINTS, STEP, TIME_BONUS } from './config.js';
import { findPar, isSolved, litCount, otherFace, parseLevel, traceBeam } from './beam.js';
import { LEVELS } from './levels.js';
import { SCREEN_CLEAR, SCREEN_FAILED, SCREEN_FINISHED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function createGame() {
  return {
    screen: SCREEN_TITLE,
    levelIndex: 0,
    levelCount: LEVELS.length,
    level: null,
    levelName: LEVELS[0].name,
    levelHint: LEVELS[0].hint,
    par: 0,
    limit: 0,
    moves: 0,
    time: 0,
    score: 0,
    best: 0,
    pearlsLit: 0,
    pearlTotal: 0,
    segments: [],
    glow: 0,
    cardAge: 0,
    lastResult: '',
  };
}

/** How many turns past the par a player may spend before the tide takes the level. */
export const MOVE_SLACK = 2;

/** Load a level by its index and reset the run's state for it. */
export function loadLevel(game, index) {
  const level = parseLevel(LEVELS[index]);
  // The level set carries its par, checked when the levels were written; the search is the
  // fallback for a level that does not.
  const par = LEVELS[index].par ?? findPar(level);
  game.level = level;
  game.levelIndex = index;
  game.levelName = LEVELS[index].name;
  game.levelHint = LEVELS[index].hint;
  game.par = par === null ? 0 : par;
  game.limit = game.par + MOVE_SLACK;
  game.moves = 0;
  game.time = 0;
  game.pearlTotal = level.pearls.length;
  game.pearlsLit = 0;
  game.glow = 0;
  game.cardAge = 0;
  game.lastResult = '';
  refreshBeam(game);
}

/** Trace the beam again and update the pearls it lights. */
export function refreshBeam(game) {
  const { segments, lit } = traceBeam(game.level);
  game.segments = segments;
  for (const pearl of game.level.pearls) {
    pearl.lit = lit.has(pearl.y * game.level.width + pearl.x);
  }
  game.pearlsLit = litCount(game.level);
}

/** The screen the game is on, as a card to draw, or null when it is playing. */
export function currentCard(game) {
  if (game.screen === SCREEN_CLEAR) {
    const spare = Math.max(0, game.par - game.moves);
    const timeBonus = Math.max(0, Math.round(360 - game.time) * TIME_BONUS);
    const pearlBonus = game.pearlsLit * PEARL_POINTS;
    return {
      title: 'Reef Awakened',
      lines: [
        `Level ${game.levelIndex + 1} cleared in ${game.moves} moves (par ${game.par})`,
        `Pearls ${game.pearlsLit} · Spare moves ${spare} · Time ${Math.round(game.time)}s`,
        `Level score ${CLEAR_POINTS + pearlBonus + spare * 25 + timeBonus}`,
      ],
      prompt: 'Click to sail on',
    };
  }
  if (game.screen === SCREEN_FAILED) {
    return {
      title: 'The Tide Rolled In',
      lines: [
        `The reef stayed dark. ${game.pearlsLit} of ${game.pearlTotal} pearls lit.`,
        `You turned ${game.moves} mirrors (par ${game.par}).`,
        'The run ends here, but the reef can be lit again.',
      ],
      prompt: 'Click to try this reef again',
    };
  }
  if (game.screen === SCREEN_FINISHED) {
    return {
      title: 'The Whole Reef Is Lit',
      lines: [
        `Ten reefs, every pearl burning. Final score ${game.score}.`,
        game.score >= game.best ? 'A new best run.' : `Your best is ${game.best}.`,
      ],
      prompt: 'Click to dive again',
    };
  }
  return null;
}

/** Start a run: the first level, a score of nothing. */
export function startRun(game) {
  game.score = 0;
  loadLevel(game, 0);
  game.screen = SCREEN_PLAY;
}

/** Turn the mirror under a cell, if that cell holds one the player may turn. */
export function turnMirrorAt(game, x, y) {
  if (game.screen !== SCREEN_PLAY) return false;
  const tile = game.level.tiles[y * game.level.width + x];
  if (!tile || tile.kind !== 'M') return false;
  tile.mirror.face = otherFace(tile.mirror.face);
  tile.mirror.turn = (tile.mirror.turn || 0) + 1;
  game.moves += 1;
  refreshBeam(game);
  return true;
}

/** Restart the level the player is on, keeping the run's score. */
export function restartLevel(game) {
  loadLevel(game, game.levelIndex);
  game.screen = SCREEN_PLAY;
}

/** What the score of the level just cleared is. */
export function levelScore(game) {
  const spare = Math.max(0, game.par - game.moves);
  const timeBonus = Math.max(0, Math.round(360 - game.time) * TIME_BONUS);
  return CLEAR_POINTS + game.pearlsLit * PEARL_POINTS + spare * 25 + timeBonus;
}

/** The simulation's fixed step: the clock, the beam's glow and the screen changes. */
export function step(game, dt) {
  if (game.screen === SCREEN_PLAY) {
    game.time += dt;
    game.glow = Math.min(1, game.glow + dt / 0.18);
    if (isSolved(game.level)) {
      game.score += levelScore(game);
      game.best = Math.max(game.best, game.score);
      game.screen = game.levelIndex >= game.levelCount - 1 ? SCREEN_FINISHED : SCREEN_CLEAR;
      game.cardAge = 0;
    } else if (game.moves > game.limit) {
      game.screen = SCREEN_FAILED;
      game.cardAge = 0;
    }
  } else {
    game.cardAge += dt;
  }
}

/** The click the player makes on the title, a card or the board. */
export function click(game, x, y) {
  if (game.screen === SCREEN_TITLE) {
    startRun(game);
    return;
  }
  if (game.screen === SCREEN_CLEAR) {
    if (game.cardAge < 0.4) return;
    loadLevel(game, game.levelIndex + 1);
    game.screen = SCREEN_PLAY;
    return;
  }
  if (game.screen === SCREEN_FINISHED) {
    if (game.cardAge < 0.4) return;
    startRun(game);
    return;
  }
  if (game.screen === SCREEN_FAILED) {
    if (game.cardAge < 0.4) return;
    restartLevel(game);
    return;
  }
  turnMirrorAt(game, x, y);
}

export { SCREEN_CLEAR, SCREEN_FAILED, SCREEN_FINISHED, SCREEN_PLAY, SCREEN_TITLE, STEP };
