// The renderer: the reef, the beam, the tiles and the cards, drawn on one canvas.
//
// Everything is drawn from the simulation's state, so what the player sees is the game: there is
// no separate view model to fall out of step with it.

import { BEAM_FADE, BOARD, CELL, PALETTE, STEP, VIEW } from './config.js';
import { SLASH, TILE_MIRROR, TILE_PEARL, TILE_SPLITTER, TILE_WALL } from './beam.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_CLEAR = 'clear';
export const SCREEN_FAILED = 'failed';
export const SCREEN_FINISHED = 'finished';

/** The board's origin in logical pixels. */
export function boardOrigin(level) {
  return {
    x: BOARD.marginX + (VIEW.width - BOARD.marginX * 2 - level.width * CELL) / 2,
    y: BOARD.marginY + (VIEW.height - BOARD.marginY * 2 - level.height * CELL) / 2,
  };
}

/** The rounded rectangle path helper, so the tiles and the cards share one look. */
function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

/** The sea behind everything: a deep gradient with a few slow currents. */
export function drawBackdrop(context, time) {
  const gradient = context.createLinearGradient(0, 0, 0, VIEW.height);
  gradient.addColorStop(0, PALETTE.deep);
  gradient.addColorStop(0.55, PALETTE.water);
  gradient.addColorStop(1, PALETTE.deep);
  context.fillStyle = gradient;
  context.fillRect(0, 0, VIEW.width, VIEW.height);

  context.save();
  context.globalAlpha = 0.05;
  context.strokeStyle = PALETTE.waterLight;
  context.lineWidth = 2;
  for (let index = 0; index < 7; index += 1) {
    const y = 40 + index * 96;
    const offset = Math.sin(time * 0.25 + index) * 40;
    context.beginPath();
    context.moveTo(-60 + offset, y);
    context.bezierCurveTo(300, y - 30, 900, y + 30, VIEW.width + 60 + offset, y);
    context.stroke();
  }
  context.restore();

  // Kelp along the edges, swaying with the current.
  context.save();
  context.globalAlpha = 0.5;
  for (let index = 0; index < 14; index += 1) {
    const x = 20 + index * 92;
    const height = 90 + (index % 4) * 34;
    const sway = Math.sin(time * 0.8 + index) * 14;
    context.strokeStyle = index % 3 === 0 ? PALETTE.coralDim : PALETTE.stoneEdge;
    context.lineWidth = 5;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(x, VIEW.height);
    context.quadraticCurveTo(x + sway, VIEW.height - height / 2, x + sway * 1.6, VIEW.height - height);
    context.stroke();
  }
  context.restore();

  // Motes of light drifting up, the plankton of the deep.
  context.save();
  for (let index = 0; index < 26; index += 1) {
    const speed = 10 + (index % 5) * 6;
    const x = (index * 97 + Math.sin(time * 0.5 + index) * 22 + VIEW.width) % VIEW.width;
    const y = VIEW.height - ((time * speed + index * 61) % (VIEW.height + 40));
    context.globalAlpha = 0.10 + (index % 3) * 0.06;
    context.fillStyle = PALETTE.pearl;
    context.beginPath();
    context.arc(x, y, 2 + (index % 2), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** The board's frame and its water cells. */
export function drawBoard(context, level, time) {
  const origin = boardOrigin(level);

  context.save();
  context.fillStyle = 'rgba(4, 18, 28, 0.62)';
  roundedRect(context, origin.x - 18, origin.y - 18, level.width * CELL + 36, level.height * CELL + 36, 22);
  context.fill();
  context.strokeStyle = PALETTE.stoneEdge;
  context.lineWidth = 2;
  context.stroke();
  context.restore();

  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      const tile = level.tiles[y * level.width + x];
      const px = origin.x + x * CELL;
      const py = origin.y + y * CELL;
      if (tile.kind === TILE_WALL) {
        drawRock(context, px, py, time, x + y);
      } else {
        context.fillStyle = (x + y) % 2 === 0 ? 'rgba(21, 57, 74, 0.46)' : 'rgba(11, 50, 71, 0.34)';
        roundedRect(context, px + 3, py + 3, CELL - 6, CELL - 6, 8);
        context.fill();
        context.strokeStyle = 'rgba(29, 80, 100, 0.35)';
        context.lineWidth = 1;
        context.stroke();
      }
    }
  }
}

/** A rock wall: a rough block with a little coral on it. */
function drawRock(context, x, y, time, seed) {
  const wobble = Math.sin(time * 1.4 + seed) * 1.5;
  context.fillStyle = PALETTE.stone;
  roundedRect(context, x + 4 + wobble, y + 4, CELL - 8, CELL - 8, 10);
  context.fill();
  context.strokeStyle = PALETTE.stoneEdge;
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = PALETTE.coralDim;
  const bud = 6 + (seed % 3);
  context.beginPath();
  context.arc(x + CELL / 2, y + CELL / 2, bud, 0, Math.PI * 2);
  context.fill();
}

/** The emitter: the lamp the beam starts from. */
function drawEmitter(context, x, y, direction, time) {
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  const pulse = 1 + Math.sin(time * 3) * 0.05;
  context.save();
  context.translate(cx, cy);
  context.rotate((direction * Math.PI) / 2);
  context.fillStyle = PALETTE.gold;
  context.beginPath();
  context.moveTo(14 * pulse, 0);
  context.lineTo(-8, -13);
  context.lineTo(-8, 13);
  context.closePath();
  context.fill();
  context.fillStyle = PALETTE.goldDim;
  roundedRect(context, -16, -11, 12, 22, 4);
  context.fill();
  context.restore();
}

/** A mirror: a bright diagonal bar the player can turn. */
function drawMirror(context, x, y, face, turn, time) {
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  const angle = (face === SLASH ? -Math.PI / 4 : Math.PI / 4) + turn * (Math.PI / 2);
  context.save();
  context.translate(cx, cy);
  context.rotate(angle);
  context.shadowColor = PALETTE.pearl;
  context.shadowBlur = 14;
  context.fillStyle = PALETTE.pearl;
  roundedRect(context, -22, -4, 44, 8, 4);
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = 'rgba(255, 255, 255, 0.85)';
  roundedRect(context, -22, -4, 44, 3, 2);
  context.fill();
  context.restore();

  // A hint that the mirror turns: a small ring around a lit one.
  if (face === SLASH) {
    context.strokeStyle = 'rgba(185, 243, 255, 0.25)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(cx, cy, CELL * 0.42, 0, Math.PI * 2);
    context.stroke();
  }
}

/** A crystal: the splitter, drawn as a faceted stone the beam forks around. */
function drawCrystal(context, x, y, time) {
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  const spin = Math.sin(time * 1.2) * 0.12;
  context.save();
  context.translate(cx, cy);
  context.rotate(spin);
  context.shadowColor = PALETTE.prism;
  context.shadowBlur = 18;
  context.fillStyle = PALETTE.prism;
  context.beginPath();
  for (let index = 0; index < 6; index += 1) {
    const angle = (Math.PI / 3) * index - Math.PI / 2;
    const px = Math.cos(angle) * 17;
    const py = Math.sin(angle) * 17;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
  context.shadowBlur = 0;
  context.fillStyle = 'rgba(255, 255, 255, 0.75)';
  context.beginPath();
  context.moveTo(0, -17);
  context.lineTo(15, 0);
  context.lineTo(0, 17);
  context.lineTo(-15, 0);
  context.closePath();
  context.fill();
  context.restore();
}

/** A pearl: the goal, dark until the beam finds it. */
function drawPearl(context, x, y, lit, time) {
  const cx = x + CELL / 2;
  const cy = y + CELL / 2;
  const pulse = lit ? 1 + Math.sin(time * 4) * 0.07 : 1;
  context.save();
  context.shadowColor = lit ? PALETTE.gold : PALETTE.prism;
  context.shadowBlur = lit ? 26 : 8;
  context.fillStyle = lit ? PALETTE.gold : '#1d5064';
  context.beginPath();
  context.arc(cx, cy, 13 * pulse, 0, Math.PI * 2);
  context.fill();
  context.shadowBlur = 0;
  context.strokeStyle = lit ? PALETTE.goldDim : PALETTE.prism;
  context.lineWidth = 2;
  context.stroke();
  if (lit) {
    context.fillStyle = PALETTE.beamCore;
    context.beginPath();
    context.arc(cx - 4, cy - 4, 4, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** The beam: a soft wide glow with a bright core, drawn segment by segment. */
export function drawBeam(context, level, segments, glow) {
  const origin = boardOrigin(level);
  const alpha = Math.min(1, glow / BEAM_FADE);

  context.save();
  context.globalAlpha = alpha;
  context.lineCap = 'round';
  context.lineJoin = 'round';

  const points = (segment) => {
    const startX = origin.x + segment.x * CELL + CELL / 2;
    const startY = origin.y + segment.y * CELL + CELL / 2;
    const dx = segment.direction === 1 ? 1 : segment.direction === 3 ? -1 : 0;
    const dy = segment.direction === 2 ? 1 : segment.direction === 0 ? -1 : 0;
    return [startX, startY, startX + dx * segment.length * CELL, startY + dy * segment.length * CELL];
  };

  context.strokeStyle = PALETTE.beam;
  context.shadowColor = PALETTE.gold;
  context.shadowBlur = 26;
  context.lineWidth = 12;
  for (const segment of segments) {
    const [x1, y1, x2, y2] = points(segment);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  context.shadowBlur = 0;
  context.strokeStyle = PALETTE.beamCore;
  context.lineWidth = 4;
  for (const segment of segments) {
    const [x1, y1, x2, y2] = points(segment);
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }
  context.restore();
}

/** The level's tiles, drawn over the beam's glow but under its bright core. */
export function drawTiles(context, level, time) {
  const origin = boardOrigin(level);
  for (let y = 0; y < level.height; y += 1) {
    for (let x = 0; x < level.width; x += 1) {
      const tile = level.tiles[y * level.width + x];
      const px = origin.x + x * CELL;
      const py = origin.y + y * CELL;
      if (tile.kind === TILE_MIRROR) {
        drawMirror(context, px, py, tile.mirror.face, tile.mirror.turn || 0, time);
      } else if (tile.kind === TILE_SPLITTER) {
        drawCrystal(context, px, py, time);
      } else if (tile.kind === TILE_PEARL) {
        const pearl = level.pearls.find((item) => item.x === x && item.y === y);
        drawPearl(context, px, py, pearl ? pearl.lit : false, time);
      } else if (tile.kind === 'emitter') {
        drawEmitter(context, px, py, level.emitter.direction, time);
      }
    }
  }
}

/** The head-up display: the level, the moves, the pearls and the score. */
export function drawHud(context, state) {
  context.save();
  context.textBaseline = 'middle';

  context.fillStyle = PALETTE.text;
  context.font = '700 30px Georgia, serif';
  context.fillText(state.levelName, 40, 46);

  context.fillStyle = PALETTE.textDim;
  context.font = '500 19px Georgia, serif';
  context.fillText(state.levelHint, 40, 78);

  context.textAlign = 'right';
  context.fillStyle = PALETTE.text;
  context.font = '700 26px Georgia, serif';
  context.fillText(`Score ${state.score}`, VIEW.width - 40, 46);

  context.fillStyle = PALETTE.textDim;
  context.font = '500 19px Georgia, serif';
  context.fillText(`Level ${state.levelIndex + 1} of ${state.levelCount}`, VIEW.width - 40, 78);

  // The pearl counter, a row of little circles.
  const pearlX = 40;
  const pearlY = 108;
  for (let index = 0; index < state.pearlTotal; index += 1) {
    const lit = index < state.pearlsLit;
    context.beginPath();
    context.arc(pearlX + index * 26, pearlY, 8, 0, Math.PI * 2);
    context.fillStyle = lit ? PALETTE.gold : 'rgba(29, 80, 100, 0.9)';
    context.fill();
    context.strokeStyle = lit ? PALETTE.goldDim : PALETTE.stoneEdge;
    context.lineWidth = 1.5;
    context.stroke();
  }

  context.textAlign = 'left';
  context.fillStyle = PALETTE.textDim;
  context.font = '500 19px Georgia, serif';
  context.fillText(`Moves ${state.moves} / par ${state.par}`, 40, 136);

  if (state.moves > state.par) {
    context.fillStyle = PALETTE.danger;
    context.fillText('Over par', 40, 162);
  }
  context.restore();
}

/** A card in the middle of the screen: the title, the clear and the fail cards. */
export function drawCard(context, card) {
  context.save();
  context.fillStyle = 'rgba(4, 18, 28, 0.72)';
  context.fillRect(0, 0, VIEW.width, VIEW.height);

  const width = 640;
  const height = 320;
  const x = (VIEW.width - width) / 2;
  const y = (VIEW.height - height) / 2;

  context.fillStyle = PALETTE.waterLight;
  roundedRect(context, x, y, width, height, 26);
  context.fill();
  context.strokeStyle = PALETTE.stoneEdge;
  context.lineWidth = 3;
  context.stroke();

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = PALETTE.text;
  context.font = '700 46px Georgia, serif';
  context.fillText(card.title, VIEW.width / 2, y + 84);

  context.fillStyle = PALETTE.textDim;
  context.font = '500 21px Georgia, serif';
  for (let index = 0; index < card.lines.length; index += 1) {
    context.fillText(card.lines[index], VIEW.width / 2, y + 148 + index * 34);
  }

  if (card.prompt) {
    context.fillStyle = PALETTE.gold;
    context.font = '700 23px Georgia, serif';
    context.fillText(card.prompt, VIEW.width / 2, y + height - 52);
  }
  context.restore();
}

/** The title card's flourish: the game's name, big, over the sea. */
export function drawTitle(context, state, time) {
  context.save();
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.fillStyle = PALETTE.gold;
  context.font = '700 92px Georgia, serif';
  context.shadowColor = PALETTE.gold;
  context.shadowBlur = 30;
  context.fillText('Tideweaver', VIEW.width / 2, 250);
  context.shadowBlur = 0;

  context.fillStyle = PALETTE.text;
  context.font = '500 24px Georgia, serif';
  context.fillText('Turn the mirrors. Light every pearl. Wake the reef.', VIEW.width / 2, 320);

  context.fillStyle = PALETTE.textDim;
  context.font = '500 20px Georgia, serif';
  context.fillText('Click a mirror to turn it ninety degrees.', VIEW.width / 2, 372);
  context.fillText('Move the mouse and press R to restart the level.', VIEW.width / 2, 404);

  const blink = 0.6 + Math.sin(time * 3) * 0.4;
  context.fillStyle = PALETTE.gold;
  context.globalAlpha = blink;
  context.font = '700 27px Georgia, serif';
  context.fillText('Click to dive in', VIEW.width / 2, 500);
  context.globalAlpha = 1;

  if (state.best > 0) {
    context.fillStyle = PALETTE.textDim;
    context.font = '500 20px Georgia, serif';
    context.fillText(`Best run ${state.best}`, VIEW.width / 2, 566);
  }
  context.restore();
}
