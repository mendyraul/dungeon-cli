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

  for (int i = 0; i < 7; ++i) {
    Pos p{xDist(rng()), yDist(rng())};
    if (map_.isWalkable(p) && p != player_.p) enemies_.push_back(Enemy{p});
  }

  for (int i = 0; i < 4; ++i) {
    Pos p{xDist(rng()), yDist(rng())};
    if (map_.isWalkable(p) && p != player_.p) worldItems_.push_back({p, Item{ItemType::Potion, "Potion", 10}});
  }
  for (int i = 0; i < 2; ++i) {
    Pos p{xDist(rng()), yDist(rng())};
    if (map_.isWalkable(p) && p != player_.p) worldItems_.push_back({p, Item{ItemType::Sword, "Sword", 2}});
  }

  pushLog("Welcome to dungeon-cli. Reach > to win.");
  pushLog("Commands: w/a/s/d, i, u <idx>, save, load, stats, help, fog, rest, buy <potion|sword>, quit");
}

void Game::run() {
  while (running_) {
    draw();
    std::string in;
    std::getline(std::cin, in);
    if (in.empty()) continue;
    handleInput(in);

    if (player_.hp <= 0) {
      pushLog("You died. Game over.");
      draw();
      running_ = false;
    }
    if (won_) {
      pushLog("You escaped! You win.");
      draw();
      running_ = false;
    }
  }
}

void Game::draw() const {
  std::cout << "\x1B[2J\x1B[H";
  for (int y = 0; y < map_.height(); ++y) {
    for (int x = 0; x < map_.width(); ++x) {
      Pos p{x, y};
      if (!isVisible(p)) {
        std::cout << ' ';
        continue;
      }
      if (player_.p == p) {
        std::cout << '@';
        continue;
      }
      auto eIdx = enemyAt(p);
      if (eIdx && enemies_[*eIdx].alive) {
        std::cout << 'g';
        continue;
      }
      auto iIdx = itemAt(p);
      if (iIdx) {
        std::cout << (worldItems_[*iIdx].second.type == ItemType::Potion ? '!' : '/');
        continue;
      }
      std::cout << map_.glyphAt(p);
    }
    std::cout << "\n";
  }

  std::cout << "HP " << player_.hp << "/" << player_.maxHp << "  ATK " << player_.atk << "  DEF " << player_.def
            << "  Gold " << player_.gold << "  LVL " << player_.level << "  XP " << player_.xp << "/" << player_.nextXp
            << "  Fog:" << (fogEnabled_ ? "ON" : "OFF") << "\n";
  std::cout << "--- Log ---\n";
  int start = std::max(0, static_cast<int>(log_.size()) - 6);
  for (int i = start; i < static_cast<int>(log_.size()); ++i) std::cout << log_[i] << "\n";
  std::cout << "> ";
}

void Game::pushLog(const std::string& msg) { log_.push_back(msg); }

void Game::handleInput(const std::string& in) {
  if (in == "w") tryMove(0, -1);
  else if (in == "a") tryMove(-1, 0);
  else if (in == "s") tryMove(0, 1);
  else if (in == "d") tryMove(1, 0);
  else if (in == "i") showInventory();
  else if (in.rfind("u ", 0) == 0) {
    std::istringstream iss(in.substr(2));
    size_t idx;
    if (iss >> idx) useItem(idx);
  } else if (in == "stats") {
    pushLog("HP=" + std::to_string(player_.hp) + " ATK=" + std::to_string(player_.atk) + " DEF=" + std::to_string(player_.def)
            + " LVL=" + std::to_string(player_.level) + " XP=" + std::to_string(player_.xp) + "/" + std::to_string(player_.nextXp));
  } else if (in == "help") {
    pushLog("w/a/s/d move | i inv | u <idx> use | buy potion|sword | rest | fog | save/load | stats | quit");
  } else if (in == "fog") {
    fogEnabled_ = !fogEnabled_;
    pushLog(std::string("Fog of war ") + (fogEnabled_ ? "enabled" : "disabled"));
  } else if (in == "rest") {
    if (player_.hp >= player_.maxHp) {
      pushLog("Already full health.");
    } else {
      int heal = std::min(4, player_.maxHp - player_.hp);
      player_.hp += heal;
      pushLog("You rest and recover " + std::to_string(heal) + " HP.");
      enemyTurn();
    }
  } else if (in.rfind("buy ", 0) == 0) {
    std::string what = in.substr(4);
    if (map_.glyphAt(player_.p) != '$') {
      pushLog("Stand on a $ tile to buy.");
    } else if (what == "potion") {
      if (player_.gold < 8) pushLog("Need 8 gold for potion.");
      else {
        player_.gold -= 8;
        player_.inv.push_back(Item{ItemType::Potion, "Potion", 10});
        pushLog("Bought Potion for 8 gold.");
      }
    } else if (what == "sword") {
      if (player_.gold < 20) pushLog("Need 20 gold for sword.");
      else {
        player_.gold -= 20;
        player_.inv.push_back(Item{ItemType::Sword, "Sword", 2});
        pushLog("Bought Sword for 20 gold.");
      }
    } else {
      pushLog("Unknown shop item. Try: buy potion | buy sword");
    }
  } else if (in == "save") {
    pushLog(save("savegame.txt") ? "Saved to savegame.txt" : "Save failed");
  } else if (in == "load") {
    pushLog(load("savegame.txt") ? "Loaded savegame.txt" : "Load failed");
  } else if (in == "quit") {
    running_ = false;
  } else {
    pushLog("Unknown command.");
  }
}

void Game::tryMove(int dx, int dy) {
  Pos np{player_.p.x + dx, player_.p.y + dy};
  auto ei = enemyAt(np);
  if (ei && enemies_[*ei].alive) {
    attackEnemy(enemies_[*ei]);
    enemyTurn();
    return;
  }
  if (!map_.isWalkable(np)) {
    pushLog("Bump.");
    return;
  }
  player_.p = np;
  pickItemAtPlayer();

  char tile = map_.glyphAt(player_.p);
  if (tile == '^') {
    std::uniform_int_distribution<int> trap(2, 6);
    int dmg = trap(rng());
    player_.hp -= dmg;
    pushLog("Trap! You take " + std::to_string(dmg) + " damage.");
  } else if (tile == '$') {
    pushLog("You found a shop tile. Try: buy potion | buy sword");
  }

  if (player_.p == map_.exitPos()) {
    won_ = true;
    return;
  }
  enemyTurn();
}

void Game::enemyTurn() {
  for (auto& e : enemies_) {
    if (!e.alive) continue;
    int dist = std::abs(e.p.x - player_.p.x) + std::abs(e.p.y - player_.p.y);
    if (dist == 1) {
      attackPlayer(e);
      continue;
    }
    if (dist <= 6) {
      Pos step = e.p;
      if (player_.p.x < e.p.x) step.x--;
      else if (player_.p.x > e.p.x) step.x++;
      else if (player_.p.y < e.p.y) step.y--;
      else if (player_.p.y > e.p.y) step.y++;
      if (map_.isWalkable(step) && !enemyAt(step) && step != player_.p) e.p = step;
    }
  }
}

void Game::attackEnemy(Enemy& e) {
  std::uniform_int_distribution<int> crit(1, 100);
  bool isCrit = crit(rng()) <= 15;
  int dmg = rollDamage(player_.atk, e.def) + (isCrit ? 3 : 0);
  e.hp -= dmg;
  pushLog(std::string(isCrit ? "Critical! " : "") + "You hit goblin for " + std::to_string(dmg));
  if (e.hp <= 0) {
    e.alive = false;
    player_.gold += 5;
    player_.xp += 10;
    pushLog("Goblin down. +5 gold, +10 XP");

    while (player_.xp >= player_.nextXp) {
      player_.xp -= player_.nextXp;
      player_.level += 1;
      player_.nextXp += 10;
      player_.maxHp += 4;
      player_.hp = std::min(player_.maxHp, player_.hp + 4);
      player_.atk += 1;
      if (player_.level % 2 == 0) player_.def += 1;
      pushLog("Level up! Now level " + std::to_string(player_.level));
    }
  }
}

void Game::attackPlayer(Enemy& e) {
  std::uniform_int_distribution<int> crit(1, 100);
  bool isCrit = crit(rng()) <= 10;
  int dmg = rollDamage(e.atk, player_.def) + (isCrit ? 2 : 0);
  player_.hp -= dmg;
  pushLog(std::string(isCrit ? "Enemy critical! " : "") + "Goblin hits you for " + std::to_string(dmg));
}

void Game::pickItemAtPlayer() {
  auto ii = itemAt(player_.p);
  if (!ii) return;
  auto item = worldItems_[*ii].second;
  player_.inv.push_back(item);
  worldItems_.erase(worldItems_.begin() + static_cast<long>(*ii));
  pushLog("Picked up " + item.name);
}

void Game::showInventory() const {
  if (player_.inv.empty()) {
    std::cout << "\nInventory empty. Press Enter.";
    std::string s;
    std::getline(std::cin, s);
    return;
  }
  std::cout << "\nInventory:\n";
  for (size_t i = 0; i < player_.inv.size(); ++i) {
    std::cout << "  [" << i << "] " << player_.inv[i].name << "\n";
  }
  std::cout << "Press Enter.";
  std::string s;
  std::getline(std::cin, s);
}

void Game::useItem(size_t idx) {
  if (idx >= player_.inv.size()) {
    pushLog("Invalid item index.");
    return;
  }
  Item it = player_.inv[idx];
  player_.inv.erase(player_.inv.begin() + static_cast<long>(idx));

  if (it.type == ItemType::Potion) {
    int before = player_.hp;
    player_.hp = std::min(player_.maxHp, player_.hp + it.value);
    pushLog("Used Potion: +" + std::to_string(player_.hp - before) + " HP");
  } else if (it.type == ItemType::Sword) {
    player_.atk += it.value;
    pushLog("Equipped Sword: +" + std::to_string(it.value) + " ATK");
  }
}

int Game::rollDamage(int atk, int def) const {
  std::uniform_int_distribution<int> jitter(0, 2);
  return std::max(1, atk + jitter(rng()) - def);
}

bool Game::isVisible(Pos p) const {
  if (!fogEnabled_) return true;
  int dx = p.x - player_.p.x;
  int dy = p.y - player_.p.y;
  return dx * dx + dy * dy <= 7 * 7;
}

std::optional<size_t> Game::enemyAt(Pos p) const {
  for (size_t i = 0; i < enemies_.size(); ++i) {
    if (enemies_[i].alive && enemies_[i].p == p) return i;
  }
  return std::nullopt;
}

std::optional<size_t> Game::itemAt(Pos p) const {
  for (size_t i = 0; i < worldItems_.size(); ++i) {
    if (worldItems_[i].first == p) return i;
  }
  return std::nullopt;
}

bool Game::save(const std::string& path) const {
  std::ofstream out(path);
  if (!out) return false;

  out << player_.p.x << ' ' << player_.p.y << ' ' << player_.hp << ' ' << player_.maxHp << ' ' << player_.atk << ' ' << player_.def << ' ' << player_.gold
      << ' ' << player_.level << ' ' << player_.xp << ' ' << player_.nextXp << ' ' << fogEnabled_ << '\n';
  out << enemies_.size() << '\n';
  for (const auto& e : enemies_) out << e.p.x << ' ' << e.p.y << ' ' << e.hp << ' ' << e.atk << ' ' << e.def << ' ' << e.alive << '\n';
  out << worldItems_.size() << '\n';
  for (const auto& wi : worldItems_) out << wi.first.x << ' ' << wi.first.y << ' ' << static_cast<int>(wi.second.type) << ' ' << wi.second.value << ' ' << wi.second.name << '\n';
  out << player_.inv.size() << '\n';
  for (const auto& it : player_.inv) out << static_cast<int>(it.type) << ' ' << it.value << ' ' << it.name << '\n';
  return true;
}

bool Game::load(const std::string& path) {
  std::ifstream in(path);
  if (!in) return false;

  map_.generate(static_cast<unsigned>(std::time(nullptr)));
  in >> player_.p.x >> player_.p.y >> player_.hp >> player_.maxHp >> player_.atk >> player_.def >> player_.gold
     >> player_.level >> player_.xp >> player_.nextXp >> fogEnabled_;

  size_t n;
  in >> n;
  enemies_.clear();
  for (size_t i = 0; i < n; ++i) {
    Enemy e;
    in >> e.p.x >> e.p.y >> e.hp >> e.atk >> e.def >> e.alive;
    enemies_.push_back(e);
  }

  in >> n;
  worldItems_.clear();
  for (size_t i = 0; i < n; ++i) {
    int t, v;
    Pos p;
    std::string name;
    in >> p.x >> p.y >> t >> v >> name;
    worldItems_.push_back({p, Item{static_cast<ItemType>(t), name, v}});
  }

  in >> n;
  player_.inv.clear();
  for (size_t i = 0; i < n; ++i) {
    int t, v;
    std::string name;
    in >> t >> v >> name;
    player_.inv.push_back(Item{static_cast<ItemType>(t), name, v});
  }

  return true;
}
