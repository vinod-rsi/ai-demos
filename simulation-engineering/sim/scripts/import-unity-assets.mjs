/**
 * Copies the course content the sim needs out of the (read-only) Unity project
 * and into sim/public/unity/ so the build is self-contained and can be hosted
 * as plain static files on GitHub Pages.
 *
 * The original project served these folders through a Vite dev middleware
 * (/unity/* → absolute paths on this machine), which only ever worked locally.
 *
 * Run once after the Unity content changes:
 *   node scripts/import-unity-assets.mjs [path-to-unity-project]
 *
 * Requires ffmpeg for the audio pass (24-bit 44.1k WAV → 16-bit 22.05k WAV,
 * ~3x smaller; the runtime's PCM decoder handles both).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(here, '..', 'public', 'unity');

const UNITY_ROOT =
  process.argv[2] ??
  process.env.UNITY_ROOT ??
  '/Users/vinodpatil/Projects/unity/ATIENGPH_DME_10_Unity';

const A = path.join(UNITY_ROOT, 'Assets/ATIENGPH_DME_10_Assets');
const SRC = {
  logic: path.join(A, 'Topics/Conversations/ENGPH_DME_10/Resources/ENGPH_DME_10/ENGPH_DME_10_Logic'),
  markup: path.join(A, 'Topics/Conversations/ENGPH_DME_10/Resources/ENGPH_DME_10/MarkUp'),
  config: path.join(UNITY_ROOT, 'Assets/StreamingAssets'),
  audio: path.join(A, 'ATIENGPH_DME_10_Audio/Conversations/ENGPH_DME_10'),
  rebecca: path.join(A, 'ATIENGPH_DME_10_Characters/Rebecca'),
  env: path.join(A, 'ATIENGPH_DME_10_Environments/PHARM_T3_env'),
  mgfx: path.join(A, 'ATIENGPH_DME_10_MGFX/MGFX_Sprites'),
};

/**
 * Unity's animation takes carry `! # & $` in their file names. Those survive a
 * dev server but are a liability in a URL on a static host, so every FBX is
 * copied under a plain name (Stage references these names).
 */
const FBX_NAMES = {
  'rebecca!#.fbx': 'rebecca.fbx',
  'rebecca!&1_body_idle.fbx': 'rebecca_body_idle.fbx',
  'rebecca!&1_body_gesture-B.fbx': 'rebecca_body_gesture-B.fbx',
  'rebecca!&1_body_gesture-L.fbx': 'rebecca_body_gesture-L.fbx',
  'rebecca!&1_body_gesture-R.fbx': 'rebecca_body_gesture-R.fbx',
  'rebecca!&1_body_nod.fbx': 'rebecca_body_nod.fbx',
  'rebecca!&2_head_tilt-L.fbx': 'rebecca_head_tilt-L.fbx',
  'rebecca!&2_head_tilt-R.fbx': 'rebecca_head_tilt-R.fbx',
  'rebecca!&6_mouth_Phonemes.fbx': 'rebecca_mouth_phonemes.fbx',
};

const isMeta = (name) => name.endsWith('.meta');

function copyTree(from, to, filter = () => true) {
  fs.mkdirSync(to, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (isMeta(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    if (entry.isDirectory()) count += copyTree(src, dst, filter);
    else if (filter(entry.name)) {
      fs.copyFileSync(src, dst);
      count++;
    }
  }
  return count;
}

function requireDir(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`missing ${label}: ${p}\nPass the Unity project root as the first argument.`);
    process.exit(1);
  }
}

for (const [label, dir] of Object.entries(SRC)) requireDir(dir, label);

fs.rmSync(PUBLIC, { recursive: true, force: true });

// --- Konverse logic ---------------------------------------------------------
const logicOut = path.join(PUBLIC, 'logic');
console.log(`logic     ${copyTree(SRC.logic, logicOut)} files`);

// A static host can't answer the dev middleware's "?list" directory listing,
// so the Nodes manifest is written out at import time (FetchContentSource
// reads __list.json).
const nodes = fs
  .readdirSync(path.join(logicOut, 'Nodes'))
  .filter((f) => f.endsWith('.json'))
  .sort();
fs.writeFileSync(path.join(logicOut, 'Nodes', '__list.json'), JSON.stringify(nodes, null, 2));
console.log(`          + Nodes/__list.json (${nodes.length} nodes)`);

// --- Markup, keyboard config, MGFX sprites ----------------------------------
console.log(`markup    ${copyTree(SRC.markup, path.join(PUBLIC, 'markup'))} files`);
console.log(`config    ${copyTree(SRC.config, path.join(PUBLIC, 'config'))} files`);
console.log(`mgfx      ${copyTree(SRC.mgfx, path.join(PUBLIC, 'mgfx', 'MGFX_Sprites'))} files`);

// --- 3D assets --------------------------------------------------------------
const rebeccaFbxOut = path.join(PUBLIC, 'models/rebecca/FBX');
fs.mkdirSync(rebeccaFbxOut, { recursive: true });
for (const [from, to] of Object.entries(FBX_NAMES)) {
  const src = path.join(SRC.rebecca, 'FBX', from);
  requireDir(src, `rebecca take ${from}`);
  fs.copyFileSync(src, path.join(rebeccaFbxOut, to));
}
console.log(`rebecca   ${Object.keys(FBX_NAMES).length} takes`);
console.log(
  `          ${copyTree(path.join(SRC.rebecca, 'Textures'), path.join(PUBLIC, 'models/rebecca/Textures'), (f) => f.endsWith('.png'))} textures`,
);

const envFbxOut = path.join(PUBLIC, 'models/env/fbx');
fs.mkdirSync(envFbxOut, { recursive: true });
fs.copyFileSync(
  path.join(SRC.env, 'fbx', 'PHARM_T3_env$.fbx'),
  path.join(envFbxOut, 'pharm_t3_env.fbx'),
);
console.log(
  `env       1 fbx + ${copyTree(path.join(SRC.env, 'textures'), path.join(PUBLIC, 'models/env/textures'), (f) => f.endsWith('.png'))} textures`,
);

// --- Dialogue audio ---------------------------------------------------------
// 24-bit/44.1k mono is ~68 MB across the course; speech at 16-bit/22.05k is
// indistinguishable through the sim's WebAudio path and about a third the size.
const audioOut = path.join(PUBLIC, 'audio');
fs.mkdirSync(audioOut, { recursive: true });
const wavs = fs.readdirSync(SRC.audio).filter((f) => f.endsWith('.wav'));
let bytes = 0;
for (const wav of wavs) {
  const dst = path.join(audioOut, wav);
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-i', path.join(SRC.audio, wav),
    '-ac', '1', '-ar', '22050', '-c:a', 'pcm_s16le',
    dst,
  ]);
  bytes += fs.statSync(dst).size;
}
console.log(`audio     ${wavs.length} clips, ${(bytes / 1048576).toFixed(1)} MB (transcoded)`);

const total = execFileSync('du', ['-sh', PUBLIC]).toString().split('\t')[0];
console.log(`\ntotal     ${total} in ${path.relative(process.cwd(), PUBLIC)}`);
