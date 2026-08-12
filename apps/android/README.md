# Krug Android

Minimal React Native CLI + TypeScript Android client for the Krug API. It supports owner bootstrap/login, secure access-token storage, `GET /api/me`, chat and message loading/sending, and a reconnecting WebSocket client.

## Requirements

- Node.js 22
- Java 17 (`JAVA_HOME` set to a JDK 17 installation)
- Android SDK with API 35 and build tools 35.0.0
- Gradle available on `PATH` for the initial wrapper bootstrap in this checked-in starter

## Install and run

```powershell
cd E:\GB_Mesenger\apps\android
npm install
npm run typecheck
npm start
npm run android
```

Build a debug APK:

```powershell
cd E:\GB_Mesenger\apps\android
npm install
cd android
.\gradlew.bat assembleDebug
```

The APK is written to `android\app\build\outputs\apk\debug\app-debug.apk`.

## Public build-time URLs

The defaults are deliberately nonfunctional and contain no credentials:

- `https://invalid.krug.local`
- `wss://invalid.krug.local`

Pass public URLs to Gradle when building:

```powershell
cd android
.\gradlew.bat assembleDebug -PKRUG_API_URL=https://example.invalid -PKRUG_WS_URL=wss://example.invalid
```

The REST URL is used with the backend's `/api` prefix. The WebSocket URL is used as `<KRUG_WS_URL>/ws?token=...`.

## Emulator networking

An Android emulator cannot use the host machine's `localhost` for the backend. If the backend runs on the same development machine, use `http://10.0.2.2:<port>` for `KRUG_API_URL` and `ws://10.0.2.2:<port>` for `KRUG_WS_URL`. This starter intentionally does not enable cleartext traffic; use HTTPS/WSS for normal builds, or configure a development-only network security policy outside this minimal project if local HTTP is required.

## Security

Access tokens are stored with `react-native-keychain`, which uses Android Keystore-backed storage where available. Passwords, refresh tokens, signing keys, and other credentials are never written to project files. The manifest requests only `android.permission.INTERNET`.

## CI note

For GitHub Actions, install Node 22, Java 17, Android API 35/build-tools 35.0.0, run `npm install`, then `cd android && .\gradlew.bat assembleDebug` on Windows (or `./gradlew assembleDebug` on Linux after a standard Gradle wrapper JAR has been generated/committed). This starter includes wrapper scripts and properties but cannot include the binary `gradle-wrapper.jar` through the available file tools; generate it once with a local Gradle installation before relying on a clean CI runner.
