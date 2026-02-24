#include "Map.hpp"

Map::Map(int w, int h) : w_(w), h_(h), grid_(h, std::string(w, '#')) {}

void Map::generate(unsigned seed) {
  std::mt19937 rng(seed);
  grid_.assign(h_, std::string(w_, '#'));

  // Carve random walk floor.
  Pos cur{w_ / 2, h_ / 2};
  grid_[cur.y][cur.x] = '.';
  for (int i = 0; i < w_ * h_ * 6; ++i) {
    int d = static_cast<int>(rng() % 4);
    if (d == 0) cur.x = std::max(1, cur.x - 1);
    if (d == 1) cur.x = std::min(w_ - 2, cur.x + 1);
    if (d == 2) cur.y = std::max(1, cur.y - 1);
    if (d == 3) cur.y = std::min(h_ - 2, cur.y + 1);
    grid_[cur.y][cur.x] = '.';
  }

  // Ensure border walls.
  for (int x = 0; x < w_; ++x) grid_[0][x] = grid_[h_ - 1][x] = '#';
  for (int y = 0; y < h_; ++y) grid_[y][0] = grid_[y][w_ - 1] = '#';

  // Place exit on a floor tile.
  for (int y = h_ - 2; y >= 1; --y) {
    bool placed = false;
    for (int x = w_ - 2; x >= 1; --x) {
      if (grid_[y][x] == '.') {
        grid_[y][x] = '>';
        exit_ = {x, y};
        placed = true;
        break;
      }
    }
    if (placed) break;
  }

  // Place traps and a shop tile on existing floor.
  int traps = std::max(6, (w_ * h_) / 55);
  while (traps-- > 0) {
    int x = 1 + static_cast<int>(rng() % (w_ - 2));
    int y = 1 + static_cast<int>(rng() % (h_ - 2));
    if (grid_[y][x] == '.') grid_[y][x] = '^';
  }

  bool shopPlaced = false;
  for (int tries = 0; tries < 400 && !shopPlaced; ++tries) {
    int x = 1 + static_cast<int>(rng() % (w_ - 2));
    int y = 1 + static_cast<int>(rng() % (h_ - 2));
    if (grid_[y][x] == '.') {
      grid_[y][x] = '$';
      shopPlaced = true;
    }
  }
}

bool Map::inBounds(Pos p) const { return p.x >= 0 && p.x < w_ && p.y >= 0 && p.y < h_; }

bool Map::isWalkable(Pos p) const {
  if (!inBounds(p)) return false;
  char c = grid_[p.y][p.x];
  return c == '.' || c == '>' || c == '^' || c == '$';
}

char Map::glyphAt(Pos p) const {
  if (!inBounds(p)) return '#';
  return grid_[p.y][p.x];
}
