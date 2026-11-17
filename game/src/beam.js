// The beam: where it comes from, how it turns, and which pearls it reaches.
//
// The beam is traced cell by cell. Its state is the cell it is in and the direction it is
// travelling in, so it enters the emitter's cell heading the emitter's way and each step moves it
// one cell on. In empty water it keeps its direction. A mirror turns it ninety degrees, a wall
// stops it, a pearl catches it. A beam that leaves the grid is lost, and a beam that comes back to
// a cell it has already crossed in the same direction is a loop, so it is lost too: without that
// rule a mirror loop would spin forever.

import { EAST, NORTH, SOUTH, WEST } from './config.js';

export const TILE_EMPTY = '.';
export const TILE_WALL = '#';
export const TILE_PEARL = 'O';
export const TILE_FIXED = '=';
export const TILE_MIRROR = 'M';
export const TILE_SPLITTER = 'X';

/** The two turnings a mirror can have. */
export const SLASH = '/';
export const BACKSLASH = '\\';

/** The direction an emitter points, by the character it is drawn with. */
export const EMITTER_DIRECTION = {
  '^': NORTH,
  '>': EAST,
  v: SOUTH,
  '<': WEST,
};

/** The cell each direction moves to. */
export const STEP_BY_DIRECTION = {
  [NORTH]: [0, -1],
  [EAST]: [1, 0],
  [SOUTH]: [0, 1],
  [WEST]: [-1, 0],
};

/** What a mirror does to each direction it can be hit from. */
const REFLECT = {
  [SLASH]: {
    [NORTH]: EAST,
    [EAST]: NORTH,
    [SOUTH]: WEST,
    [WEST]: SOUTH,
  },
  [BACKSLASH]: {
    [NORTH]: WEST,
    [WEST]: NORTH,
    [SOUTH]: EAST,
    [EAST]: SOUTH,
  },
};

/** The other turning of a mirror. */
export function otherFace(face) {
  return face === SLASH ? BACKSLASH : SLASH;
}

/** The direction a beam takes after it meets a mirror. */
export function reflect(face, direction) {
  return REFLECT[face][direction];
}

/**
 * Read a level's grid into the pieces the game works with: the tiles, where the emitter sits,
 * where the pearls are and where the mirrors are.
 */
export function parseLevel(level) {
  const height = level.grid.length;
  const width = level.grid[0].length;
  const tiles = [];
  const mirrors = [];
  const pearls = [];
  let emitter = null;

  for (let y = 0; y < height; y += 1) {
    const row = level.grid[y];
    for (let x = 0; x < width; x += 1) {
      const char = row[x];
      if (char === TILE_WALL) {
        tiles.push({ kind: TILE_WALL });
      } else if (char === TILE_PEARL) {
        tiles.push({ kind: TILE_PEARL });
        pearls.push({ x, y, lit: false });
      } else if (char === TILE_FIXED) {
        const mirror = { x, y, face: SLASH, fixed: true, turn: 0 };
        mirrors.push(mirror);
        tiles.push({ kind: TILE_FIXED, mirror });
      } else if (char === TILE_SPLITTER) {
        tiles.push({ kind: TILE_SPLITTER });
      } else if (char === SLASH || char === BACKSLASH) {
        const mirror = { x, y, face: char, fixed: false, turn: 0 };
        mirrors.push(mirror);
        tiles.push({ kind: TILE_MIRROR, mirror });
      } else if (char in EMITTER_DIRECTION) {
        tiles.push({ kind: 'emitter' });
        emitter = { x, y, direction: EMITTER_DIRECTION[char] };
      } else {
        tiles.push({ kind: TILE_EMPTY });
      }
    }
  }

  return { width, height, tiles, mirrors, pearls, emitter };
}

/**
 * Trace the beam from the emitter and report the path it walks and the pearls it lights.
 *
 * The path is a list of segments, each a straight run of cells starting at a cell and running in
 * one direction, so the renderer draws one line per segment rather than one line per cell.
 *
 * A splitter sends the beam on in its own direction and also to its right, so the beam can reach
 * two pearls at once. The trace is a small work list rather than a single walk, because a split
 * leaves two beams to follow.
 */
export function traceBeam(level) {
  const segments = [];
  const lit = new Set();
  if (!level.emitter) return { segments, lit };

  const inside = (cx, cy) => cx >= 0 && cy >= 0 && cx < level.width && cy < level.height;
  const seen = new Set();
  const work = [
    {
      x: level.emitter.x,
      y: level.emitter.y,
      direction: level.emitter.direction,
      segment: { x: level.emitter.x, y: level.emitter.y, direction: level.emitter.direction, length: 1 },
    },
  ];

  while (work.length > 0) {
    const state = work.pop();
    const key = `${state.x},${state.y},${state.direction}`;
    if (seen.has(key)) continue;
    seen.add(key);

    let x = state.x;
    let y = state.y;
    let direction = state.direction;
    let segment = state.segment;

    for (;;) {
      const [dx, dy] = STEP_BY_DIRECTION[direction];
      const nextX = x + dx;
      const nextY = y + dy;

      if (!inside(nextX, nextY)) {
        segments.push(segment);
        break;
      }

      const nextTile = level.tiles[nextY * level.width + nextX];

      if (nextTile.kind === TILE_WALL) {
        segments.push(segment);
        break;
      }

      if (nextTile.kind === TILE_PEARL) {
        lit.add(nextY * level.width + nextX);
        segment.length += 1;
        x = nextX;
        y = nextY;
        continue;
      }

      if (nextTile.kind === TILE_MIRROR || nextTile.kind === TILE_FIXED) {
        segments.push(segment);
        const turned = reflect(nextTile.mirror.face, direction);
        work.push({
          x: nextX,
          y: nextY,
          direction: turned,
          segment: { x: nextX, y: nextY, direction: turned, length: 1 },
        });
        break;
      }

      if (nextTile.kind === TILE_SPLITTER) {
        segments.push(segment);
        const straight = direction;
        const right = (direction + 1) % 4;
        work.push({
          x: nextX,
          y: nextY,
          direction: straight,
          segment: { x: nextX, y: nextY, direction: straight, length: 1 },
        });
        work.push({
          x: nextX,
          y: nextY,
          direction: right,
          segment: { x: nextX, y: nextY, direction: right, length: 1 },
        });
        break;
      }

      segment.length += 1;
      x = nextX;
      y = nextY;
    }
  }

  return { segments, lit };
}

/** True when every pearl of the level is lit. */
export function isSolved(level) {
  const { lit } = traceBeam(level);
  return level.pearls.length > 0 && level.pearls.every((pearl) => lit.has(pearl.y * level.width + pearl.x));
}

/** How many pearls of the level are lit right now. */
export function litCount(level) {
  const { lit } = traceBeam(level);
  return level.pearls.filter((pearl) => lit.has(pearl.y * level.width + pearl.x)).length;
}

/**
 * The fewest turns of the player mirrors that solve the level, or null when it cannot be solved.
 *
 * The search is over the turnings of the player-turnable mirrors, one bit each: the level has few
 * of them, so every combination is tried and the shortest one that lights every pearl is the par.
 */
export function findPar(level) {
  const turnable = level.mirrors.filter((mirror) => !mirror.fixed);
  const original = level.mirrors.map((mirror) => mirror.face);
  let best = null;

  const total = 2 ** turnable.length;
  for (let mask = 0; mask < total; mask += 1) {
    let turns = 0;
    for (let index = 0; index < turnable.length; index += 1) {
      const mirror = turnable[index];
      const face = original[level.mirrors.indexOf(mirror)];
      if ((mask >> index) & 1) {
        mirror.face = otherFace(face);
        turns += 1;
      } else {
        mirror.face = face;
      }
    }
    if (isSolved(level)) {
      if (best === null || turns < best) best = turns;
    }
  }

  level.mirrors.forEach((mirror, index) => {
    mirror.face = original[index];
  });
  return best;
}
