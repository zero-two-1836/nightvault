// Nightvault — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a
// browser, no build step, no network). This program delivers it: it copies
// game/ and screenshots/ into the output directory and writes dossier.json
// there with the vendored make.fun dossier builder, so the judge reads
// exactly the files that were handed in.
//
// In the grader the output directory is /output; locally, point
// MAKEFUN_OUTPUT_DIR at a scratch folder:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoDir, 'screenshots'))) {
  cpSync(join(repoDir, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps below are the scorer's own limits for this bounty: at most 4
// screenshots of 256 KiB each, at most 993 files and 48 MiB under game/,
// no game path over 1000 bytes, and the dossier's source text capped at
// 160 KiB. buildDossier refuses anything the scorer would refuse.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
