# Updates and production publication

## Signed Android release

Release builds never use the Android debug key. `apps/android/android/app/build.gradle` reads signing values from the ignored `apps/android/android/keystore.properties` or these environment variables:

- `ANDROID_KEYSTORE_FILE`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Any Gradle task whose name contains `release` fails before building when a value is absent or the keystore file does not exist. Copy `apps/android/android/keystore.properties.example` to `keystore.properties`; never commit the populated file or a `.jks`/`.keystore` file.

## Local build

Generate and protect a production key once (example; enter secrets interactively):

```powershell
cd E:\GB_Mesenger\apps\android\android
keytool -genkeypair -v -keystore app\krug-release.jks -storetype PKCS12 -alias krug-release -keyalg RSA -keysize 4096 -sigalg SHA256withRSA -validity 10000
Copy-Item keystore.properties.example keystore.properties
# Replace placeholders locally; do not print or commit their values.
.\gradlew.bat clean assembleRelease --no-daemon
```

If the repository wrapper JAR is unavailable, install/use Gradle 8.10.2 and run `gradle -p apps/android/android clean assembleRelease --no-daemon`.

Verify and inspect:

```powershell
$bt="$env:LOCALAPPDATA\Android\Sdk\build-tools\36.0.0"
& "$bt\apksigner.bat" verify --verbose --print-certs apps\android\android\app\build\outputs\apk\release\app-release.apk
& "$bt\aapt.exe" dump badging apps\android\android\app\build\outputs\apk\release\app-release.apk
Get-FileHash download-site\GB-Messenger-0.1.0-release.apk -Algorithm SHA256
```

Current production artifact metadata: package `com.krug`, versionName `0.1.0`, versionCode `1`, minSdk `24`, targetSdk `35`. Publication files are `download-site/GB-Messenger-0.1.0-release.apk`, its `.sha256` file, and `release-metadata.json`.

## CI signing

The Android release workflow restores the keystore only inside the CI runner. Configure encrypted repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, and `ANDROID_KEY_PASSWORD`. Create the base64 value without line wrapping, store only the encrypted secret, and never place it in workflow YAML, logs, artifacts, caches, or the download-site ZIP. Rotate the key credentials if exposure is suspected; preserve the production key securely because Android upgrades must use the same signer.

## Download-site archive

Rebuild `download-site/GB-Messenger-download-site.zip` from the files in `download-site`, excluding the ZIP itself and every keystore, populated properties file, secret, and build/cache directory. Inspect archive entries before publication and verify the APK checksum after extraction.