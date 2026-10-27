/**
 * Applies the two Android edits that Capacitor cannot do for you, and that
 * silently break IPTV playback if you forget them.
 *
 * 1. CLEARTEXT TRAFFIC
 *    Since Android 9, apps may not make plain-http requests at all. A huge
 *    share of IPTV streams are http://, not https://. Without this flag
 *    those streams fail with a bare "network error" and no explanation.
 *
 * 2. ORIENTATION + CONFIG CHANGES
 *    By default Android destroys and recreates the Activity when you rotate
 *    the phone, which tears down the WebView and restarts your stream from
 *    scratch. Declaring configChanges lets the Activity survive rotation,
 *    so playback continues when the user turns the phone to watch.
 *
 * Safe to run repeatedly: it checks before editing, and does nothing at all
 * if android/ has not been generated yet.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!existsSync(manifest)) {
  console.log('  android/ not generated yet — skipping (run "npx cap add android" first)');
  process.exit(0);
}

let xml = readFileSync(manifest, 'utf8');
const before = xml;

// --- 1. cleartext http ---
if (!/android:usesCleartextTraffic/.test(xml)) {
  xml = xml.replace(/<application\b/, '<application\n        android:usesCleartextTraffic="true"');
  console.log('  added android:usesCleartextTraffic="true"  (allows http:// streams)');
} else {
  console.log('  cleartext traffic already allowed');
}

// --- 2. survive rotation ---
const needed = ['orientation', 'screenSize', 'screenLayout', 'smallestScreenSize',
                'keyboard', 'keyboardHidden', 'uiMode'];
const m = xml.match(/android:configChanges="([^"]*)"/);
if (m) {
  const have = m[1].split('|');
  const merged = [...new Set([...have, ...needed])].join('|');
  if (merged !== m[1]) {
    xml = xml.replace(m[0], `android:configChanges="${merged}"`);
    console.log('  extended android:configChanges  (stream survives rotation)');
  } else {
    console.log('  configChanges already complete');
  }
} else {
  console.log('  ! could not find android:configChanges — add it to <activity> by hand');
}

if (xml !== before) {
  writeFileSync(manifest, xml);
  console.log('\nAndroidManifest.xml patched.');
} else {
  console.log('\nAndroidManifest.xml already correct.');
}
