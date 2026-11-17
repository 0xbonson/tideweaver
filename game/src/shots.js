// The screenshot scenes behind ?shot=start|play|end.
//
// Each scene sets the game up for a known moment: the title screen as it opens, a reef with its
// beam running and its HUD up, and the card the player sees when a reef is still dark. The scenes
// are set up from the real levels and the real rules, so the same command always gives the same
// frame.

import { LEVELS } from './levels.js';
import { otherFace, parseLevel, traceBeam } from './beam.js';
import { SCREEN_CLEAR, SCREEN_FAILED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

/** The reef the play scene shows: one with several pearls, so the board reads at a glance. */
const PLAY_LEVEL = 8;

/** Turn a mirror, as a click does. */
function flip(mirror) {
  mirror.face = otherFace(mirror.face);
  mirror.turn = (mirror.turn || 0) + 1;
}

/**
 * The turning of the mirrors that lights the most pearls without lighting them all.
 *
 * The play scene should show a reef in progress, so the search takes the best half-solved
 * position it can find rather than the solved one the player is aiming at.
 */
function bestPartialTurn(level) {
  const turnable = level.mirrors.filter((mirror) => !mirror.fixed);
  const original = turnable.map((mirror) => mirror.face);
  let best = null;

  for (let mask = 0; mask < 2 ** turnable.length; mask += 1) {
    let turns = 0;
    turnable.forEach((mirror, index) => {
      if ((mask >> index) & 1) {
        mirror.face = otherFace(original[index]);
        turns += 1;
      } else {
        mirror.face = original[index];
      }
    });
    const { lit } = traceBeam(level);
    const count = level.pearls.filter((pearl) => lit.has(pearl.y * level.width + pearl.x)).length;
    if (count > 0 && count < level.pearls.length) {
      if (!best || count > best.count) best = { count, turns, mask };
    }
  }

  turnable.forEach((mirror, index) => {
    mirror.face = original[index];
  });
  return best;
}

/** Put the level's beam and pearls into the game, as a turn would. */
function refresh(game, level) {
  const { segments, lit } = traceBeam(level);
  game.segments = segments;
  for (const pearl of level.pearls) pearl.lit = lit.has(pearl.y * level.width + pearl.x);
  game.pearlsLit = level.pearls.filter((pearl) => pearl.lit).length;
}

/**
 * Set the game up for the named scene.
 *
 * The play scene is a reef that is one turn from solved: the beam runs along the top row and
 * down a corridor, so the board reads at a glance and the HUD shows a run in progress. The end
 * scene is the first reef with the turns spent and the pearl still dark.
 */
export function stageShot(name, game) {
  if (name === 'play') {
    const level = parseLevel(LEVELS[PLAY_LEVEL]);
    game.level = level;
    game.levelIndex = PLAY_LEVEL;
    game.levelName = LEVELS[PLAY_LEVEL].name;
    game.levelHint = LEVELS[PLAY_LEVEL].hint;
    game.par = LEVELS[PLAY_LEVEL].par;
    game.limit = game.par + 2;
    game.time = 37;
    game.score = 2450;
    game.pearlTotal = level.pearls.length;
    // Turn the mirrors to the best half-solved position: the scene shows a reef in progress.
    const partial = bestPartialTurn(level);
    if (partial) {
      for (let index = 0; index < level.mirrors.length; index += 1) {
        const mirror = level.mirrors[index];
        if (mirror.fixed) continue;
        const bit = level.mirrors.filter((item) => !item.fixed).indexOf(mirror);
        if ((partial.mask >> bit) & 1) flip(mirror);
      }
    }
    game.moves = partial ? partial.turns : 0;
    refresh(game, level);
    game.glow = 1;
    game.screen = SCREEN_PLAY;
    return null;
  }

  if (name === 'clear') {
    const level = parseLevel(LEVELS[3]);
    game.level = level;
    game.levelIndex = 3;
    game.levelName = LEVELS[3].name;
    game.levelHint = LEVELS[3].hint;
    game.par = LEVELS[3].par;
    game.limit = game.par + 2;
    game.moves = game.par;
    game.time = 41;
    game.score = 6100;
    game.pearlTotal = level.pearls.length;
    for (const mirror of level.mirrors) flip(mirror);
    refresh(game, level);
    game.glow = 1;
    game.screen = SCREEN_CLEAR;
    game.cardAge = 1;
    return null;
  }

  if (name === 'end') {
    const level = parseLevel(LEVELS[0]);
    game.level = level;
    game.levelIndex = 0;
    game.levelName = LEVELS[0].name;
    game.levelHint = LEVELS[0].hint;
    game.par = LEVELS[0].par;
    game.limit = game.par + 2;
    game.moves = game.limit + 1;
    game.time = 52;
    game.score = 1180;
    game.pearlTotal = level.pearls.length;
    refresh(game, level);
    game.glow = 1;
    game.screen = SCREEN_FAILED;
    game.cardAge = 1;
    return null;
  }

  game.screen = SCREEN_TITLE;
  game.best = 4820;
  return null;
}
