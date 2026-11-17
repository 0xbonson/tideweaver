// Every tuning number and colour of Tideweaver in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the window's size.

/** The logical size of the canvas, in pixels. */
export const VIEW = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The size of one grid cell, in logical pixels. */
export const CELL = 56;

/** Where the grid sits inside the view: the board is centred in the play area. */
export const BOARD = { marginX: 196, marginY: 136 };

/** Directions, in the order the beam code uses: up, right, down, left. */
export const NORTH = 0;
export const EAST = 1;
export const SOUTH = 2;
export const WEST = 3;

/** The colour language: a deep sea, warm light, cold stone. */
export const PALETTE = {
  deep: '#04121c',
  water: '#072234',
  waterLight: '#0b3247',
  stone: '#15394a',
  stoneEdge: '#1d5064',
  coral: '#ff7a6b',
  coralDim: '#c2554a',
  gold: '#ffd166',
  goldDim: '#b8913f',
  pearl: '#b9f3ff',
  beam: '#ffe9a8',
  beamCore: '#fffdf2',
  prism: '#8ae7ff',
  text: '#eaf7ff',
  textDim: '#8fb6c9',
  danger: '#ff5d73',
};

/** How long a beam's glow takes to fade in when it appears, in seconds. */
export const BEAM_FADE = 0.18;

/** How long a rotating mirror takes to turn, in seconds: the turn is readable, not instant. */
export const TURN_TIME = 0.16;

/** How long a level-clear or fail card takes to fade in, in seconds. */
export const CARD_FADE = 0.3;

/** The number of pearls a level can hold, and what each is worth in points. */
export const PEARL_POINTS = 250;

/** What clearing a level is worth before the move and time bonuses. */
export const CLEAR_POINTS = 1000;

/** Points a move costs, and points a spare second gives back. */
export const MOVE_COST = 12;
export const TIME_BONUS = 3;

/** The score a run carries over between levels, and the score a failed level keeps. */
export const SCORE = { carry: 0, failKeep: 0 };
