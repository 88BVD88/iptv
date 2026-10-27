# My IPTV — Android build

Your web app, wrapped in a real Android app with Capacitor. `www/index.html` is the
same code you already tested in Chrome, with the Android-specific fixes applied.

## What you need first

Node.js 20 or newer, and Android Studio (which brings the Android SDK and a JDK with
it). Install Android Studio first and open it once so it finishes downloading the SDK,
otherwise the Gradle build fails with a confusing message about a missing SDK location.

## Build it

Run these in order, in this folder:

```bash
# 1. project dependencies (hls.js + mpegts.js)
npm install

# 2. Capacitor itself — @latest so the versions all agree with each other
npm install @capacitor/core@latest @capacitor/android@latest @capacitor/app@latest @capacitor/status-bar@latest
npm install -D @capacitor/cli@latest

# 3. generate the native Android project (reads capacitor.config.json)
npx cap add android

# 4. bundle the libs, patch the manifest, sync, and open Android Studio
npm run open
```

Then plug in your phone with USB debugging enabled and press Run in Android Studio.
Or skip the IDE entirely and build an installable file:

```bash
npm run apk
# -> android/app/build/outputs/apk/debug/app-debug.apk
```

After any edit to `www/index.html`, run `npm run sync` to copy it into the native
project. Editing the copy under `android/app/src/main/assets/` directly is a trap —
the next sync overwrites it.

## The three things that would have broken, and how they are handled

**CORS, again.** Inside the WebView your page origin is `https://localhost`, so
fetching a playlist from a provider is still cross-origin and still blocked exactly as
it was in the browser. The app now routes its own playlist requests through
`CapacitorHttp`, which performs them in Java where CORS does not exist. That is the
`httpGet()` helper near the top of the script. It also sends a VLC `User-Agent`,
because some providers reject the stock WebView one.

Note that `CapacitorHttp` is deliberately left `"enabled": false` in
`capacitor.config.json`. That flag controls a *global* monkey-patch of `fetch` and
`XMLHttpRequest`, and it is known to break hls.js, which needs raw arraybuffer
responses and byte-range requests for segments. The plugin still works when called
directly, so we get native HTTP for playlists while hls.js keeps the untouched XHR it
depends on. Turning that flag on is the single most likely way to break this app.

**Cleartext HTTP.** Android has forbidden plain `http://` requests since Android 9, and
a large share of IPTV streams are `http://`. `tools/patch-android.mjs` adds
`android:usesCleartextTraffic="true"` to the manifest, and `allowMixedContent` in the
Capacitor config lets the `https://localhost` page load those `http://` videos.
Without both, such channels fail with a bare "network error".

**Rotation killing the stream.** By default Android destroys the Activity on rotate,
which tears down the WebView and restarts the stream. The same patch script extends
`android:configChanges` so the Activity survives, and the app now goes fullscreen when
you turn the phone to landscape and back when you turn it upright. Double-tapping the
video toggles fullscreen manually.

Also handled: the hardware back button now closes the dialog, then the player, then
exits — instead of killing the app mid-stream; playback pauses when the app is
backgrounded, so Android does not kill you for holding a hardware decoder; and the
layout respects notches and gesture bars via `env(safe-area-inset-*)`.

## Debugging on the phone

This is the single most useful thing to know: with the app running on a connected
phone, open `chrome://inspect#devices` in desktop Chrome. You get the full DevTools
console for the app's WebView, so the same diagnostics you saw in the browser are
visible on the device.

## Optional extras

For an app icon, drop a 1024×1024 PNG at `resources/icon.png` and run
`npx @capacitor/assets generate --android`.

To keep the screen awake during playback, `npm install @capacitor-community/keep-awake`
(pick the version matching your Capacitor major). The code already calls it if present
and silently skips it if not, so nothing breaks either way.

## If a stream still will not play

Work out which layer failed from the red toast, which now names the cause.

A decode error means the stream arrived fine but Android's WebView cannot decode it —
usually H.265/HEVC video or AC-3/E-AC-3 audio. No amount of JavaScript fixes this. The
real solution is to stop decoding in the WebView and hand the URL to ExoPlayer, which
is hardware-accelerated, handles HEVC and AC-3, ignores CORS entirely and uses far less
battery. `@capacitor-community/video-player` does this, or a thin custom plugin gives
you full control. The app's `play()` function is the only place that touches playback,
so swapping the engine is a contained change rather than a rewrite — that is why it is
structured that way.

An HTTP 403 usually means a required `Referer` header or an exhausted subscription
token. A 404 means the channel is simply dead, which is routine for public playlists;
confirm the app itself still works via **Source → Mix → Load bundled test playlist**,
which reads the `example.m3u` shipped inside the APK, then play its Apple BipBop entry.
If that plays, the app is fine and the problem is the channel.
