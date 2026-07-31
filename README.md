# ColorWheelPlugin 🎡

A Minecraft Paper plugin that runs an exciting color wheel game every 2.5 minutes!

## Features

### Game Flow

1. **Wheel Spin (10 seconds)** 🎰
   - Colors rapidly change on the boss bar
   - Builds excitement as the wheel spins

2. **Preparation Phase (2 minutes)** ⏱️
   - Target color is revealed
   - Players place the colored block under their feet
   - Countdown announcements at 60s, 30s, and 10s

3. **Final Countdown (10 seconds)** ⏰
   - Final warning to get in position
   - Sound effects intensify
   - Title countdown on screen

4. **Results** 🏆
   - Automatic win/lose detection
   - Particle effects for winners
   - Detailed results with win rate

### 27 Available Colors

| Category | Colors |
|----------|--------|
| Red | RED, DARK_RED |
| Orange | ORANGE, TERRACOTTA |
| Yellow | YELLOW, GOLD |
| Green | GREEN, EMERALD, LIME |
| Cyan/Aqua | CYAN, DIAMOND, PRISMARINE |
| Blue | BLUE, LAPIS, LIGHT_BLUE |
| Purple | PURPLE, AMETHYST, MAGENTA |
| Pink | PINK, MAGMA |
| White/Gray | WHITE, GRAY, LIGHT_GRAY |
| Black | BLACK |
| Brown | BROWN |

Each color matches multiple block types (wool, concrete, terracotta, etc.)!

## Requirements

- **Server:** PaperMC 1.21.9
- **Java:** 21

## Installation

1. Download `ColorWheelPlugin.jar` from [Releases](https://github.com/USERNAME/ColorWheelPlugin/releases)
2. Place the JAR file in your server's `plugins` folder
3. Restart the server
4. Done! The game will start automatically

## Commands

| Command | Description | Permission |
|---------|-------------|------------|
| `/colorwheel start` | Start the game loop | `colorwheel.admin` |
| `/colorwheel stop` | Stop all games | `colorwheel.admin` |
| `/colorwheel force` | Force start immediately | `colorwheel.admin` |
| `/colorwheel info` | Show current game status | `colorwheel.admin` |
| `/colorwheel colors` | List all available colors | `colorwheel.admin` |
| `/colorwheel reload` | Reload configuration | `colorwheel.admin` |

## Permissions

| Permission | Description | Default |
|------------|-------------|---------|
| `colorwheel.admin` | Access to admin commands | OP |
| `colorwheel.play` | Ability to participate | Everyone |

## Configuration

Edit `plugins/ColorWheelPlugin/config.yml` to customize:

- Game timing intervals
- Colors and materials
- Messages
- World settings
- Rewards

## Building from Source

```bash
# Clone the repository
git clone https://github.com/USERNAME/ColorWheelPlugin.git
cd ColorWheelPlugin

# Build with Gradle
chmod +x gradlew
./gradlew clean build

# JAR will be in build/libs/
```

## Development

This plugin uses:
- **PaperMC API 1.21.9**
- **Gradle** for build automation
- **Java 21**

## Support

- Join our Discord: https://discord.gg/Cz9eDvHMQj
- Report issues on GitHub
- Follow updates: https://invmc.in

## License

All rights reserved © 2026 INVMC. Made by OddBoyXD

---

**Enjoy the game!** 🎮
