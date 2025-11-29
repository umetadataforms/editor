#!/bin/bash

# Run in project root
cd ../

docker run --rm -ti \
-v "$PWD":/project \
-v "$PWD/dist":/project/dist \
electronuserland/builder:wine \
bash -lc "npm ci && npm run build && npx electron-builder --win nsis zip"
