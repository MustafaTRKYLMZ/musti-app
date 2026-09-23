#!/usr/bin/env bash
# Build Musti Dev debug APK (no USB). Copy the APK to your phone and install it.
set -euo pipefail

cd "$(dirname "$0")/.."
export APP_VARIANT=development

echo "→ Prebuild Android (com.musti.app.dev) ..."
npx expo prebuild --platform android --no-install

echo "→ Building debug APK ..."
cd android
./gradlew --stop >/dev/null 2>&1 || true
./gradlew :app:assembleDebug --no-daemon

APK="app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "Done. Install on phone:"
echo "  $(pwd)/${APK}"
echo ""
echo "Then on Mac: npm run dev:mobile"
echo "Open 'Musti Dev' on phone (same Wi‑Fi as Mac)."
