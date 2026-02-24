#pragma once

#include "Types.hpp"
#include <random>
#include <string>
#include <vector>

class Map {
public:
  Map(int w = 40, int h = 20);

  void generate(unsigned seed);
  bool inBounds(Pos p) const;
  bool isWalkable(Pos p) const;
  char glyphAt(Pos p) const;

  int width() const { return w_; }
  int height() const { return h_; }
  const std::vector<std::string>& rows() const { return grid_; }
  Pos exitPos() const { return exit_; }

private:
  int w_;
  int h_;
  std::vector<std::string> grid_;
  Pos exit_{};
};
