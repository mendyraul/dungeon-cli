#!/usr/bin/env bash
set -euo pipefail
mkdir -p web/wasm
emcc src/wasm_bridge.cpp -O3 -s MODULARIZE=1 -s EXPORT_ES6=1 \
  -s ENVIRONMENT=web -s ALLOW_MEMORY_GROWTH=1 \
  --bind -o web/wasm/dungeon.js
