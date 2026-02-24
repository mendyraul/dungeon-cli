#pragma once

#include <string>
#include <vector>

struct Pos {
  int x{0};
  int y{0};
  bool operator==(const Pos& other) const { return x == other.x && y == other.y; }
  bool operator!=(const Pos& other) const { return !(*this == other); }
};

enum class TileType { Wall, Floor, Exit };

enum class ItemType { Potion, Sword };

struct Item {
  ItemType type{ItemType::Potion};
  std::string name{"Potion"};
  int value{0};
};

struct Enemy {
  Pos p{};
  int hp{12};
  int atk{4};
  int def{1};
  bool alive{true};
};

struct Player {
  Pos p{};
  int hp{30};
  int maxHp{30};
  int atk{6};
  int def{2};
  int gold{0};
  int level{1};
  int xp{0};
  int nextXp{20};
  std::vector<Item> inv{};
};
