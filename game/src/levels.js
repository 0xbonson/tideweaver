// The levels of Tideweaver: a grid of tiles, the emitter, the pearls to light, and the walls.
//
// A level is a picture the player has to solve, so each one is written by hand rather than
// generated: the emitter's beam must reach every pearl, and the mirrors the player turns are the
// only thing that changes.
//
// Tile characters:
//   '.' empty water      '#' rock wall        'O' a pearl (the goal)
//   '>' '<' '^' 'v' the emitter, pointing that way
//   '/' '\' a mirror the player turns
//   'X' a crystal, which splits the beam: it goes on and to the right
//
// Every level below was checked with the game's own solver, so each one can be solved, and the
// par of each is the fewest turns of the mirrors that solve it.

export const LEVELS = [
  {
    name: 'First Light',
    hint: 'Turn the mirror so the beam reaches the pearl.',
    par: 1,
    grid: [
      "...#..",
      "......",
      ">.../.",
      "......",
      ".#..O.",
    ],
  },
  {
    name: 'Two Turns',
    hint: 'Two mirrors, two corners. Click a mirror to turn it.',
    par: 2,
    grid: [
      ">../...",
      ".....#.",
      ".......",
      ".../..O",
      ".#.....",
      ".......",
    ],
  },
  {
    name: 'The Long Way',
    hint: 'Rock does not let light through. Go around it.',
    par: 4,
    grid: [
      ">...../.",
      "....#...",
      "........",
      "..\\...\\.",
      "...#....",
      "#.......",
      "../....O",
    ],
  },
  {
    name: 'Two Pearls',
    hint: 'One beam, two pearls, two corners.',
    par: 2,
    grid: [
      "........",
      "........",
      ">../.#..",
      "........",
      ".#......",
      ".../..OO",
    ],
  },
  {
    name: 'The Fork',
    hint: 'A crystal splits the beam. Light both pearls.',
    par: 1,
    grid: [
      "........",
      ">..X./..",
      "........",
      ".......#",
      ".#.O.O..",
      "........",
      "........",
    ],
  },
  {
    name: 'Narrow Channel',
    hint: 'The channel is one cell wide. Every turn counts.',
    par: 4,
    grid: [
      ">....../",
      "........",
      ".#.#.#..",
      "..\\....\\",
      "........",
      "....##..",
      "#.......",
      "../...O.",
    ],
  },
  {
    name: 'Split Decision',
    hint: 'Not every mirror you turn helps. Look before you turn.',
    par: 2,
    grid: [
      "........",
      "....\\.OO",
      "..#.....",
      "........",
      ">...\\...",
      "......#.",
      ".#......",
      "........",
    ],
  },
  {
    name: 'Deep Trench',
    hint: 'The pearl sits at the bottom of the trench.',
    par: 4,
    grid: [
      ">......./",
      "....#....",
      ".#.......",
      "..\\.....\\",
      ".....#...",
      "...#.....",
      ".......#.",
      "../...O..",
    ],
  },
  {
    name: 'Three Pearls',
    hint: 'Three pearls on one long road.',
    par: 2,
    grid: [
      ".........",
      ".........",
      ">../..#..",
      ".........",
      "...O.#...",
      ".#.......",
      ".../..O.O",
      ".........",
    ],
  },
  {
    name: 'The Reef',
    hint: 'Every wall is in the way. This is the last reef.',
    par: 4,
    grid: [
      ".........",
      ">./.#....",
      "......\\.O",
      "...#...#.",
      "#........",
      "../...\\..",
      "....#...#",
      ".#.......",
    ],
  },
];
