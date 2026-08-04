# Capacitor Setup for MoinsBête

## Quick Start

This project uses [Capacitor](https://capacitorjs.com/) to wrap the web app in a native container for android and ios.

the app connects to production at `https://moinsbete.guibo.com`. no static export needed.

## Android Build

### prerequisites
- android studio (free from [androidstudio.google.com](https://developer.android.com/studio))
- java jdk 17+ (included with android studio)
- google play developer account ($25 one-time fee)
- google play console app created

### build aab with android studio (recommended)
1. open android studio
2. `file` > `open` > select the `android/` directory in this project
3. wait for gradle sync to complete (check bottom status bar)
4. `build` > `generate signed bundle / aab`
5. select or create keystore:
   - if new: click `create new`
   - store path: `keystore.jks` (or your preferred location)
   - password: choose a strong password
   - alias: `moinsbete`
   - validity: `25` years
   - fill certificate info (name, org, etc.)
6. select `release` variant
7. click `sign` — aab will be generated
8. aab location: `android/app/build/outputs/bundle/release/app-release.aab`

### build aab with command line (alternative)
```bash
cd android
./gradlew bundleRelease
cd ..
cp android/app/build/outputs/bundle/release/app-release.aab ./moinsbete-app.aab
```

### upload to google play
1. go to [google play console](https://play.google.com/console)
2. select your app
3. go to **internal testing** > **setup internal testing**
4. upload `moinsbete-app.aab`
5. add testers (email addresses) — need 20 testers for 14 days before production release
6. click `start rollout`
7. testers receive email invite, install via play store app

### production release
1. after 14 days with 20+ testers in internal/closed testing
2. go to **production** > **create release**
3. upload aab
4. fill release info (what's new, notes)
5. review app mapping (already done during setup)
6. complete release checklist
7. submit for review (usually approved same day)

## iOS Build (on Mac)

### prerequisites
- mac with xcode installed
- apple developer account ($99/year)
- ios 15+ device (optional for testing)

### build ipa with xcode
1. open terminal in project root
2. run `npx cap open ios`
3. xcode opens the project
4. select the `App` target
5. go to **signing & capabilities**:
   - enable `signing`
   - select your apple developer team
   - bundle identifier: `com.moinsbete.app` (or your custom domain reverse)
6. connect your iphone/ipad via usb (optional, for testing)
7. select a simulator or your device as destination
8. `product` > `archive`
9. distribution window appears:
   - select `distribute app`
   - select `app store connect`
   - follow prompts to upload
10. or select `development` for local testing

### upload to app store connect
1. go to [app store connect](https://appstoreconnect.apple.com)
2. select your app
3. go to **builds** > your archive should appear automatically
4. fill app info:
   - privacy policy url: `https://moinsbete.guibo.com/en/confidentialite`
   - app description
   - screenshots (required — capture from simulator or device)
   - keywords, support url, marketing url
5. submit for review
6. apple reviews (usually 1-3 days)
7. once approved, set status to `ready for sale`

## Configuration

### capacitor.config.ts
- app id: `com.moinsbete.app`
- app name: `MoinsBête`
- server url: `https://moinsbete.guibo.com`
- pwa disabled when `CAPACITOR=true`
- turnstile captcha skipped when `CAPACITOR=true`

### environment variables
```bash
CAPACITOR=true
NEXTAUTH_URL=https://moinsbete.guibo.com
```

### key changes made
- `next.config.ts`: pwa disabled when capacitor env set
- `src/actions/auth-actions.ts`: turnstile captcha skipped in capacitor
- `capacitor.config.ts`: app config with server url and plugins
- `android/`: android native project
- `ios/`: ios native project

## App Icons

icons generated from `public/icon-512.svg` using `scripts/generate-icons.js`.

### android icons (auto-generated, in android/app/src/main/res/)
- mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi/ic_launcher.png
- mipmap-mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi/ic_launcher_round.png
- drawable/splash.png

### ios icons (auto-generated, in ios/App/App/AppIcon.appiconset/)
- 11 icon sizes (29px to 1024px)
- SplashScreen.png (2732x2732)

### regenerate icons
```bash
npm install sharp --save-dev
node scripts/generate-icons.js
```

## Privacy Policy
- url: `https://moinsbete.guibo.com/en/confidentialite`
- required for both google play and app store
- set in app store listing during submission

## Troubleshooting

### android studio gradle sync fails
- `file` > `invalidate caches` > `restart`
- check android sdk installed: `tools` > `sdk manager` > sdk 36
- check java version: `java -version` (need 17+)

### build fails
- check android studio logs for errors
- ensure all dependencies downloaded (check internet connection)
- try `build` > `clean project` then `build` > `rebuild project`

### ios signing errors
- check apple developer team selected in xcode
- ensure certificates provisioned in [developer.apple.com](https://developer.apple.com)
- check bundle identifier matches your app in app store connect

### app doesn't load in webview
- check server url in `capacitor.config.ts`
- verify production site is accessible
- check browser console in webview (chrome devtools remote debug)

## Next Steps
1. build aab and test with internal testers
2. collect feedback, fix issues
3. submit to production after 14 days
4. prepare ios build on mac
5. submit to app store
