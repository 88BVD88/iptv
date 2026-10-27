/**
 * Copies the playback libraries out of node_modules into www/vendor/.
 *
 * Why not just keep the CDN <script> tags? Because a packaged app that
 * depends on a CDN is broken on first launch without a connection, slower
 * on every launch, and at the mercy of a third party staying online.
 * Shipping the files inside the APK removes all three problems.
 */
import { copyFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out  = join(root, 'www', 'vendor');

const files = [
  ['node_modules/hls.js/dist/hls.min.js',   'hls.min.js'],
  ['node_modules/mpegts.js/dist/mpegts.js', 'mpegts.js']
];

mkdirSync(out, { recursive: true });

let missing = 0;
for (const [from, to] of files) {
  const src = join(root, from);
  if (!existsSync(src)) {
    console.error(`  MISSING  ${from}  — run "npm install" first`);
    missing++;
    continue;
  }
  copyFileSync(src, join(out, to));
  console.log(`  vendored ${to}  (${(statSync(src).size / 1024).toFixed(0)} KB)`);
}

if (missing) {
  console.error('\nThe app will not play anything without these. Run: npm install');
  process.exit(1);
}
console.log('\nPlayback libraries bundled into www/vendor/');
