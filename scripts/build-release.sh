#!/usr/bin/env bash
# Builds dist/learnloop-extension-<version>.zip from the extension folder.
set -euo pipefail
cd "$(dirname "$0")/.."
VERSION=$(node -p "require('./extension/manifest.json').version")
mkdir -p dist
rm -f "dist/learnloop-extension-$VERSION.zip"
(cd extension && zip -qr "../dist/learnloop-extension-$VERSION.zip" . -x '*.DS_Store')
echo "dist/learnloop-extension-$VERSION.zip"
# Copy for the one-click download link in the README
mkdir -p download && cp "dist/learnloop-extension-$VERSION.zip" "download/LearnLoop-v$VERSION.zip"
