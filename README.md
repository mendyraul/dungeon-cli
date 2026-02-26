# dungeon-cli

Terminal roguelike template in C++17.

## What this project includes

- Procedural dungeon generation
- Turn-based movement and combat
- Enemy chase + melee attacks
- Inventory with consumables/equipment
- Save/load support (`savegame.txt`)
- Win condition: reach the `>` exit tile

## New features added

1. **Leveling + XP system**
   - Kill enemies to gain XP
   - Auto-level when XP threshold is reached
   - Leveling increases combat stats and max HP

2. **Critical hit system**
   - Player and enemies can both land critical hits
   - Adds combat variance and higher-stakes encounters

3. **Trap + shop tiles**
   - `^` traps damage the player on entry
   - `$` shop tile lets you buy items with gold

4. **Fog toggle + rest + help commands**
   - Toggle fog of war during play (`fog`)
   - Rest to recover HP (`rest`, but enemies still act)
   - Built-in help command (`help`)

## Tile legend

- `@` player
- `g` goblin
- `!` potion on ground
- `/` sword on ground
- `^` trap tile
- `$` shop tile
- `>` dungeon exit
- `.` floor
- `#` wall

## Controls / commands

- `w` / `a` / `s` / `d` — move
- `i` — show inventory
- `u <idx>` — use inventory item at index
- `buy potion` — buy potion on shop tile
- `buy sword` — buy sword on shop tile
- `rest` — recover a small amount of HP (enemy turn still happens)
- `fog` — toggle fog of war on/off
- `stats` — show current player stats
- `help` — quick command reference
- `save` — write save file (`savegame.txt`)
- `load` — load save file
- `quit` — exit game

## Build and run

### Option A: Makefile (recommended)
```bash
cd dungeon-cli
make
./dungeon-cli
```

### Option B: direct g++
```bash
g++ -std=c++17 -O2 -Wall -Wextra -Iinclude src/*.cpp -o dungeon-cli
./dungeon-cli
```

## Save/load notes

- Save file is plain text: `savegame.txt`
- Loading starts from a freshly generated map, then restores player/enemy/item state

## Git notes

Repository is initialized locally on branch `dev`.
No commits were made per your request.

## Web + Vercel (WASM Arcade)

This repo now hosts a unified web arcade (Dungeon + Blackjack) under `web/`.

- Entry: `web/index.html`
- Blackjack assets: `web/js/blackjack.js`, `web/css/blackjack.css`
- WASM bridge source: `src/wasm_bridge.cpp`
- WASM build script: `scripts/build-wasm.sh`
- Vercel config: `vercel.json` (`outputDirectory: web`)

### WASM build (requires Emscripten)

```bash
./scripts/build-wasm.sh
```

If `emcc` is missing, install Emscripten (`emsdk`) first.
