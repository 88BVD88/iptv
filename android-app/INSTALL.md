# How to get this onto your Android phone

## First, the important bit

**The files in this folder are not an app.** They are source code. Android can only
install `.apk` files, and an APK has to be *compiled* from source by the Android build
tools — so there is nothing here you can tap to install, and copying this folder to the
phone does not help. The compiling has to happen on a computer, or on GitHub's servers.

Think of it as a recipe: useful, but you still need an oven.

So the files go from your **Windows PC** up to GitHub, GitHub does the compiling, and
what comes back down to your phone is a finished APK.

Everything below is done once. After that, every change you make produces a new APK
automatically.

---

## Route A — the installable web app (2 minutes, no compiling)

Do this first. It gets a working app with its own icon onto your home screen almost
immediately, and it is the same code as the APK.

1. In your repo, go to **Settings → Pages**, and under *Source* choose
   **GitHub Actions**. Save.
2. Go to the **Actions** tab and wait for the `web` job to finish (about a minute).
3. It prints a link like `https://<your-username>.github.io/my-iptv/`.
4. Open that link in **Chrome on your phone**.
5. Tap the **⤓ Install** button in the app's header — or Chrome's menu ⋮ →
   *Add to Home screen*.

You now have a My IPTV icon on your home screen that opens without browser bars, works
offline for its own interface, and updates itself whenever you push a change.

The one limitation: it runs inside the browser engine, so it is bound by CORS exactly
like the desktop version was. Your current playlist works in Chrome already, so it will
almost certainly work here too — but a provider that blocks browsers needs Route B.

---

## Route B — the real APK

1. Make a free account at github.com.
2. **+ → New repository**, name it `my-iptv`, choose **Public**, create it.
   Public matters: release files in a private repo can only be downloaded while logged
   into GitHub, which makes installing on the phone awkward. There are no secrets in
   this project — your playlist URL and Xtream login are typed into the app and saved
   only on your device, never in the repo.
3. On the empty repo page, click **uploading an existing file**. Unzip
   `my-iptv-android.zip` on your PC, select everything inside, drag it into the
   browser, and **Commit changes**.
4. **Check that `.github/workflows/android.yml` exists in the repo.** GitHub's uploader
   sometimes drops folders whose names begin with a dot, and without this file nothing
   builds. If it is missing: **Add file → Create new file**, type
   `.github/workflows/android.yml` as the filename, paste in the contents of that file
   from the unzipped folder, and commit.
5. Open the **Actions** tab. The build starts by itself. Green tick in ~4 minutes.
6. Go to the repo home page, click **Releases** in the right sidebar, and you will find
   `my-iptv.apk` attached to *Latest build*.

To install it, open this link **on the phone** and tap the file:

```
https://github.com/<your-username>/my-iptv/releases/latest/download/my-iptv.apk
```

That URL always serves the newest build, so bookmark it.

Android will warn you that the app comes from an unknown developer, because it is
signed with the standard debug key rather than a Play Store identity. Tap
**Settings → allow from this source**, then **Install anyway**. That is normal for a
self-built app.

### If the build fails

Open the red run in the Actions tab, click the step that failed, copy the last twenty
or so lines and send them to me. Failures at this stage are nearly always a version
mismatch between Capacitor and the JDK, which is a one-line change in the workflow.

---

## Checking it works

Open the app, then **Source → Mix → Load bundled test playlist**, and play the
*Apple BipBop* entry. That stream is online essentially always, so if it plays, the app
itself is sound and anything else that fails is the channel's fault. Then add your own
playlist with **Source → M3U URL** or **Xtream**.

## Making changes later

Edit `www/index.html` straight in GitHub's web editor, commit, and a few minutes later
both the web app and the APK link serve the new version. You never need build tools on
your own machine.

## Building on your own PC instead

If you would rather not use GitHub, see `README.md` — it covers the local route with
Android Studio, which gives faster rebuilds and a debugger.

## About signing

The debug key is fine for your own phone and for sharing with friends. It is not
accepted by the Play Store, and a debug-signed app cannot later be upgraded in place by
a release-signed one. When you want a proper release key, I can add keystore signing to
the workflow using encrypted repository secrets.
