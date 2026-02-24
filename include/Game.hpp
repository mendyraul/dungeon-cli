#pragma once

#include "Map.hpp"
#include "Types.hpp"
#include <optional>
#include <string>
#include <vector>

class Game {
public:
  Game();
  void run();

private:
  Map map_;
  Player player_;
  std::vector<Enemy> enemies_;
  std::vector<std::pair<Pos, Item>> worldItems_;
  std::vector<std::string> log_;
  bool running_{true};
  bool won_{false};
  bool fogEnabled_{true};

  void newGame();
  void draw() const;
  void pushLog(const std::string& msg);
  void handleInput(const std::string& in);
  void tryMove(int dx, int dy);
  void enemyTurn();
  void attackEnemy(Enemy& e);
  void attackPlayer(Enemy& e);
  void pickItemAtPlayer();
  void showInventory() const;
  void useItem(size_t idx);
  int rollDamage(int atk, int def) const;
  bool isVisible(Pos p) const;

  std::optional<size_t> enemyAt(Pos p) const;
  std::optional<size_t> itemAt(Pos p) const;

  bool save(const std::string& path) const;
  bool load(const std::string& path);
};
