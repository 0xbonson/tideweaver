// Tideweaver's entry (Node 22, standard library only).
//
// The game itself is the game/ folder beside this file: plain static files a desktop browser
// loads offline, with no build step and no network request. This program hands the entry in. It
// copies game/ and screenshots/ to the output directory and writes dossier.json, the summary the
// judge reads, using the kit's vendored buildDossier.
//
// Outside the grader's container MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });

if (existsSync(join(here, 'screenshots'))) {
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The scorer's own caps, so a copy that would be refused is caught here first: three or four
// screenshots, each at most 256 KiB, the game at most 993 files and 48 MiB, and every path under
// game/ at most 1000 bytes.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
