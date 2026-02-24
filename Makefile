CXX := g++
CXXFLAGS := -std=c++17 -O2 -Wall -Wextra -Iinclude

SRC := $(wildcard src/*.cpp)
OBJ := $(SRC:.cpp=.o)
TARGET := dungeon-cli

all: $(TARGET)

$(TARGET): $(OBJ)
	$(CXX) $(CXXFLAGS) -o $@ $^

clean:
	rm -f $(OBJ) $(TARGET)

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run
