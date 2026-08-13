# GB-Messenger Android download site

This directory contains the static production download page, the signed release APK, its SHA-256 checksum, and `release-metadata.json`.

Published artifact: `GB-Messenger-0.1.0-release.apk` (`com.krug`, versionName `0.1.0`, versionCode `1`). Verify it with the adjacent `.sha256` file and Android SDK `apksigner` before publishing.

`GB-Messenger-download-site.zip` must contain only the site assets, production APK, checksum, metadata, and this README. It must never contain a keystore, populated `keystore.properties`, environment files, secrets, build output, caches, or the ZIP itself.