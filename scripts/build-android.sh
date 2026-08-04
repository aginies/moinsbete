#!/bin/bash
set -e

echo "=== MoinsBête Android Build Script ==="
echo ""
echo "The capacitor-android project needs android studio to resolve dependencies."
echo ""
echo "Recommended: use android studio GUI"
echo "  1. open android studio"
echo "  2. file > open > select: $(pwd)/android"
echo "  3. wait for gradle sync (bottom status bar)"
echo "  4. build > generate signed bundle / aab"
echo "  5. create keystore or use debug keystore"
echo "  6. sign and download aab"
echo ""
echo "aab will be at: android/app/build/outputs/bundle/release/app-release.aab"
echo ""
echo "upload to google play:"
echo "  https://play.google.com/console/u/0/developers/ [your-account]/app/[app-id]/internal-testing"
