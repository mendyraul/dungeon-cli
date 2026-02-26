#include <string>
#include <sstream>
#include <cstdlib>
#include <ctime>
#include <emscripten/bind.h>

std::string generate_dungeon_ascii(int w, int h) {
  if (w < 10) w = 10;
  if (h < 6) h = 6;
  std::srand((unsigned)std::time(nullptr));
  std::ostringstream out;
  for (int y = 0; y < h; ++y) {
    for (int x = 0; x < w; ++x) {
      bool edge = (y == 0 || y == h - 1 || x == 0 || x == w - 1);
      if (edge) out << '#';
      else out << ((std::rand() % 100) < 12 ? '#' : '.');
    }
    if (y < h - 1) out << "\n";
  }
  return out.str();
}

EMSCRIPTEN_BINDINGS(dungeon_module) {
  emscripten::function("generate_dungeon_ascii", &generate_dungeon_ascii);
}
