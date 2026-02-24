#include "Game.hpp"

#include <algorithm>
#include <cmath>
#include <ctime>
#include <fstream>
#include <iostream>
#include <random>
#include <sstream>

namespace {
std::mt19937& rng() {
  static std::mt19937 g(static_cast<unsigned>(std::time(nullptr)));
  return g;
}
} // namespace

Game::Game() : map_(40, 20) { newGame(); }

void Game::newGame() {
  won_ = false;
  running_ = true;
  log_.clear();
  map_.generate(static_cast<unsigned>(std::time(nullptr)));

  player_ = Player{};
  player_.p = {2, 2};
  if (!map_.isWalkable(player_.p)) player_.p = {map_.width() / 2, map_.height() / 2};

  enemies_.clear();
  worldItems_.clear();

  // Place enemies/items on floor.
  std::uniform_int_distribution<int> xDist(1, map_.width() - 2);
  std::uniform_int_distribution<int> yDist(1, map_.height() - 2);

  for (int i = 0; i