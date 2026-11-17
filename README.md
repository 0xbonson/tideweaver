# tideweaver

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/0xbonson/tideweaver/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/0xbonson/tideweaver/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Tideweaver is a puzzle game about light in a deep-sea reef. A lamp sends a beam across the grid, mirrors turn it ninety degrees and crystals split it in two. Turn the mirrors until the beam reaches every pearl and the reef wakes up. Ten reefs, a par for each, and a run scored on how few turns and how little time it took.

The game is plain static files under `game/`, with no build step and no network request: open `game/index.html` in a desktop browser and it plays.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. To hand the entry in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

<sub>Entered on [make.fun](https://make.fun/?ref=kewdhhyh&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
