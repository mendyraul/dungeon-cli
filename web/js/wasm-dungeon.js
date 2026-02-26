const tabDungeon = document.getElementById('tabDungeon');
const tabBlackjack = document.getElementById('tabBlackjack');
const viewDungeon = document.getElementById('viewDungeon');
const viewBlackjack = document.getElementById('viewBlackjack');
const output = document.getElementById('dungeonOutput');

function switchTab(which) {
  const dungeon = which === 'dungeon';
  tabDungeon.classList.toggle('active', dungeon);
  tabBlackjack.classList.toggle('active', !dungeon);
  viewDungeon.classList.toggle('active', dungeon);
  viewBlackjack.classList.toggle('active', !dungeon);
}

function fallbackDungeon(w, h) {
  const rows = [];
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const edge = y === 0 || y === h - 1 || x === 0 || x === w - 1;
      row += edge ? '#' : (Math.random() < 0.12 ? '#' : '.');
    }
    rows.push(row);
  }
  return rows.join('\n');
}

let wasmApi = null;
async function initWasm() {
  try {
    const mod = await import('../wasm/dungeon.js');
    const instance = await mod.default();
    wasmApi = instance;
    output.textContent = 'WASM runtime ready. Generate to render dungeon.';
  } catch {
    output.textContent = 'WASM artifact not found yet; using JS fallback generator.';
  }
}

document.getElementById('generateDungeon').onclick = () => {
  const w = Number(document.getElementById('w').value || 25);
  const h = Number(document.getElementById('h').value || 12);
  if (wasmApi && wasmApi._generate_dungeon_ascii) {
    output.textContent = '[WASM bridge loaded, ASCII export wiring pending build step]';
    return;
  }
  output.textContent = fallbackDungeon(w, h);
};

tabDungeon.onclick = () => switchTab('dungeon');
tabBlackjack.onclick = () => switchTab('blackjack');
initWasm();
