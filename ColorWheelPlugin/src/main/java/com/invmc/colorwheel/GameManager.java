package com.invmc.colorwheel;

import net.kyori.adventure.bossbar.BossBar;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextColor;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.entity.Player;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.util.*;

public class GameManager {

    private final ColorWheelPlugin plugin;
    private final List<ColorEntry> colors;
    private ColorEntry currentColor;
    private GamePhase gamePhase;
    private BukkitTask gameTask;
    private int countdownSeconds;
    private final Map<UUID, Boolean> playerStatus;
    private BossBar bossBar;
    private BukkitTask spinTask;

    // Timing configuration (in seconds)
    private static final int SPIN_DURATION = 10;      // 10 seconds of wheel spinning
    private static final int PREPARATION_TIME = 120;  // 2 minutes of preparation
    private static final int COUNTDOWN_SECONDS = 10;  // 10 seconds final countdown

    public GameManager(ColorWheelPlugin plugin) {
        this.plugin = plugin;
        this.gamePhase = GamePhase.WAITING;
        this.playerStatus = new HashMap<>();
        this.colors = createColorList();

        startGameLoop();
    }

    private List<ColorEntry> createColorList() {
        return Arrays.asList(
            // Red family
            new ColorEntry("RED", Material.RED_WOOL, Color.fromRGB(255, 0, 0), NamedTextColor.RED, "§c"),
            new ColorEntry("DARK_RED", Material.NETHER_WART_BLOCK, Color.fromRGB(180, 0, 0), TextColor.color(220, 20, 60), "§4"),
            
            // Orange family
            new ColorEntry("ORANGE", Material.ORANGE_WOOL, Color.fromRGB(255, 165, 0), NamedTextColor.GOLD, "§6"),
            new ColorEntry("TERRACOTTA", Material.TERRACOTTA, Color.fromRGB(184, 98, 73), TextColor.color(210, 140, 100), "§e"),
            
            // Yellow family
            new ColorEntry("YELLOW", Material.YELLOW_WOOL, Color.fromRGB(255, 255, 0), NamedTextColor.YELLOW, "§e"),
            new ColorEntry("GOLD", Material.GOLD_BLOCK, Color.fromRGB(255, 215, 0), TextColor.color(255, 223, 100), "§l§6"),
            
            // Green family
            new ColorEntry("GREEN", Material.LIME_WOOL, Color.fromRGB(0, 255, 0), NamedTextColor.GREEN, "§a"),
            new ColorEntry("EMERALD", Material.EMERALD_BLOCK, Color.fromRGB(80, 220, 100), TextColor.color(50, 205, 50), "§2"),
            new ColorEntry("LIME", Material.LIME_CONCRETE, Color.fromRGB(50, 255, 50), TextColor.color(100, 255, 100), "§a"),
            
            // Cyan/Aqua family
            new ColorEntry("CYAN", Material.CYAN_WOOL, Color.fromRGB(0, 255, 255), NamedTextColor.AQUA, "§b"),
            new ColorEntry("DIAMOND", Material.DIAMOND_BLOCK, Color.fromRGB(100, 255, 255), TextColor.color(64, 224, 208), "§3"),
            new ColorEntry("PRISMARINE", Material.PRISMARINE, Color.fromRGB(50, 200, 180), TextColor.color(80, 240, 200), "§b"),
            
            // Blue family
            new ColorEntry("BLUE", Material.BLUE_WOOL, Color.fromRGB(0, 0, 255), NamedTextColor.BLUE, "§9"),
            new ColorEntry("LAPIS", Material.LAPIS_BLOCK, Color.fromRGB(0, 50, 150), TextColor.color(30, 80, 180), "§1"),
            new ColorEntry("LIGHT_BLUE", Material.LIGHT_BLUE_WOOL, Color.fromRGB(100, 150, 255), TextColor.color(100, 180, 255), "§b"),
            
            // Purple family
            new ColorEntry("PURPLE", Material.PURPLE_WOOL, Color.fromRGB(128, 0, 128), NamedTextColor.LIGHT_PURPLE, "§5"),
            new ColorEntry("AMETHYST", Material.AMETHYST_BLOCK, Color.fromRGB(170, 80, 200), TextColor.color(180, 100, 220), "§d"),
            new ColorEntry("MAGENTA", Material.MAGENTA_WOOL, Color.fromRGB(200, 50, 200), TextColor.color(220, 60, 220), "§d"),
            
            // Pink family
            new ColorEntry("PINK", Material.PINK_WOOL, Color.fromRGB(255, 192, 203), TextColor.color(255, 105, 180), "§d"),
            new ColorEntry("MAGMA", Material.MAGMA_BLOCK, Color.fromRGB(200, 50, 0), TextColor.color(255, 100, 50), "§c"),
            
            // White/Gray family
            new ColorEntry("WHITE", Material.WHITE_WOOL, Color.fromRGB(255, 255, 255), NamedTextColor.WHITE, "§f"),
            new ColorEntry("GRAY", Material.GRAY_WOOL, Color.fromRGB(128, 128, 128), NamedTextColor.DARK_GRAY, "§7"),
            new ColorEntry("LIGHT_GRAY", Material.LIGHT_GRAY_WOOL, Color.fromRGB(200, 200, 200), TextColor.color(220, 220, 220), "§8"),
            
            // Black
            new ColorEntry("BLACK", Material.BLACK_WOOL, Color.fromRGB(0, 0, 0), NamedTextColor.BLACK, "§0"),
            
            // Brown
            new ColorEntry("BROWN", Material.BROWN_WOOL, Color.fromRGB(139, 69, 19), TextColor.color(150, 75, 25), "§6")
        );
    }

    private void startGameLoop() {
        gameTask = new BukkitRunnable() {
            @Override
            public void run() {
                startGame();
            }
        }.runTaskTimer(plugin, 0L, 20L * (SPIN_DURATION + PREPARATION_TIME + COUNTDOWN_SECONDS));
    }

    public void startGame() {
        if (gamePhase != GamePhase.WAITING) {
            return;
        }

        plugin.getLogger().info("Starting Color Wheel game!");
        getRandomColor();
        
        // Phase 1: Spin the wheel
        startSpinPhase();
    }

    private void getRandomColor() {
        Random random = new Random();
        currentColor = colors.get(random.nextInt(colors.size()));
    }

    private void startSpinPhase() {
        gamePhase = GamePhase.SPINNING;
        countdownSeconds = SPIN_DURATION;

        broadcastMessage("§6§l COLOR WHEEL §r §7- The wheel is spinning! §e⏳");
        
        createBossBar("§6§l SPINNING... §r§7", BossBar.Color.YELLOW, BossBar.Overlay.PROGRESS);

        // Rapid color changes during spin
        spinTask = new BukkitRunnable() {
            final Random random = new Random();
            @Override
            public void run() {
                ColorEntry randomColor = colors.get(random.nextInt(colors.size()));
                updateSpinBossBar(randomColor);
            }
        }.runTaskTimer(plugin, 0L, 5L); // Change color every 0.25 seconds

        // End spin phase after duration
        new BukkitRunnable() {
            @Override
            public void run() {
                if (spinTask != null) {
                    spinTask.cancel();
                }
                startPreparationPhase();
            }
        }.runTaskLater(plugin, 20L * SPIN_DURATION);
    }

    private void updateSpinBossBar(ColorEntry randomColor) {
        if (bossBar == null) return;

        double progress = (double) countdownSeconds / SPIN_DURATION;
        Component title = Component.text("§6§l SPINNING... §r§7 | ").append(
            Component.text(randomColor.getFormattedName()).color(randomColor.getTextColor())
        );

        bossBar.name(title);
        bossBar.progress((float) progress);
        countdownSeconds--;
    }

    private void startPreparationPhase() {
        gamePhase = GamePhase.PREPARATION;
        countdownSeconds = PREPARATION_TIME;

        broadcastMessage("§6§l COLOR WHEEL §r §7- Target color: " + currentColor.getColorCode() + "§l" + currentColor.getDisplayName() + "§r §8| §eYou have 2 minutes to prepare!");
        broadcastMessage("§7Place §f" + currentColor.getFormattedName() + "§7 wool/blocks under your feet!");
        broadcastMessage("§7The final countdown will start in §e2 minutes§7. §cBe ready!");

        createBossBar(
            "§e§l PREPARATION §r§7 | " + currentColor.getFormattedName() + " §7 | §b120s",
            BossBar.Color.GREEN,
            BossBar.Overlay.NOTCHED_10
        );

        // Update boss bar every second during preparation
        new BukkitRunnable() {
            @Override
            public void run() {
                if (gamePhase != GamePhase.PREPARATION) {
                    cancel();
                    return;
                }

                countdownSeconds--;
                updatePreparationBossBar();

                // Announce at key intervals
                if (countdownSeconds == 60 || countdownSeconds == 30 || countdownSeconds == 10) {
                    broadcastMessage("§7⏱ " + countdownSeconds + " seconds remaining!");
                }

                if (countdownSeconds <= 0) {
                    cancel();
                    startFinalCountdown();
                }
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    private void updatePreparationBossBar() {
        if (bossBar == null) return;

        double progress = (double) countdownSeconds / PREPARATION_TIME;
        Component title = Component.text("§e§l PREPARATION §r§7 | ")
            .append(Component.text(currentColor.getFormattedName()).color(currentColor.getTextColor()))
            .append(Component.text(" §7 | §b" + countdownSeconds + "s"));

        bossBar.name(title);
        bossBar.progress((float) progress);

        // Change boss bar color based on remaining time
        if (countdownSeconds > 60) {
            bossBar.color(BossBar.Color.GREEN);
        } else if (countdownSeconds > 30) {
            bossBar.color(BossBar.Color.YELLOW);
        } else {
            bossBar.color(BossBar.Color.RED);
        }
    }

    private void startFinalCountdown() {
        gamePhase = GamePhase.COUNTDOWN;
        countdownSeconds = COUNTDOWN_SECONDS;

        broadcastMessage("§c§l FINAL COUNTDOWN! §r §eStand on " + currentColor.getFormattedName() + " §eNOW!");
        broadcastMessage("§c" + COUNTDOWN_SECONDS + " §7seconds to get in position!");

        updateBossBarForCountdown();

        new BukkitRunnable() {
            @Override
            public void run() {
                if (gamePhase != GamePhase.COUNTDOWN) {
                    cancel();
                    return;
                }

                updateBossBarForCountdown();
                broadcastTitle(countdownSeconds);

                if (countdownSeconds <= 0) {
                    cancel();
                    checkWinners();
                    gamePhase = GamePhase.ENDED;
                    scheduleNextGame();
                    return;
                }

                countdownSeconds--;
            }
        }.runTaskTimer(plugin, 0L, 20L);
    }

    private void updateBossBarForCountdown() {
        if (bossBar == null) return;

        double progress = (double) countdownSeconds / COUNTDOWN_SECONDS;
        Component title = Component.text("§c§l STAND ON ")
            .append(Component.text(currentColor.getFormattedName()).color(currentColor.getTextColor()))
            .append(Component.text(" §c | " + countdownSeconds + "s", NamedTextColor.RED));

        bossBar.name(title);
        bossBar.progress((float) progress);

        // Intensify color as countdown progresses
        if (countdownSeconds > 5) {
            bossBar.color(BossBar.Color.RED);
        } else if (countdownSeconds > 2) {
            bossBar.color(BossBar.Color.RED);
        } else {
            bossBar.color(BossBar.Color.RED);
        }
    }

    private void broadcastTitle(int seconds) {
        String subtitle = seconds > 0 
            ? "§e" + seconds + " §7seconds!"
            : "§c§l TIME'S UP!";

        for (Player player : plugin.getServer().getOnlinePlayers()) {
            if (player.hasPermission("colorwheel.play")) {
                player.sendTitle("§6§l COLOR WHEEL", subtitle, 5, 30, 5);
                player.playSound(player.getLocation(), seconds <= 3 ? "entity.enderman.teleport" : "block.note_block.pling", 1.0f, seconds <= 3 ? 2.0f : 1.0f);
            }
        }
    }

    private void checkWinners() {
        plugin.getLogger().info("Checking winners... Target color: " + currentColor.getDisplayName());

        broadcastMessage("§6§l === CHECKING PLAYERS === §r");

        for (Player player : plugin.getServer().getOnlinePlayers()) {
            if (!player.hasPermission("colorwheel.play")) continue;

            Block standingBlock = player.getLocation().getBlock();
            Block blockBelow = player.getLocation().subtract(0, 1, 0).getBlock();
            boolean isWinner = false;

            // Check if standing on the correct color block
            if (currentColor.matchesMaterial(standingBlock.getType()) || 
                currentColor.matchesMaterial(blockBelow.getType())) {
                isWinner = true;
            }

            if (isWinner) {
                playerStatus.put(player.getUniqueId(), true);
                broadcastMessage("§a✓ §f" + player.getName() + " §a- Correct! Stood on " + currentColor.getFormattedName());
                spawnFireworks(player.getLocation(), currentColor);
                player.playSound(player.getLocation(), "entity.player.levelup", 1.0f, 1.0f);
            } else {
                playerStatus.put(player.getUniqueId(), false);
                broadcastMessage("§c✗ §f" + player.getName() + " §c- Failed! Not on " + currentColor.getFormattedName());
                player.playSound(player.getLocation(), "entity.zombie.attack_wooden_door", 0.5f, 0.5f);
            }
        }

        // Announce results after 3 seconds
        new BukkitRunnable() {
            @Override
            public void run() {
                announceResults();
                cleanup();
            }
        }.runTaskLater(plugin, 60L);
    }

    private void spawnFireworks(Location location, ColorEntry color) {
        Location fireworkLoc = location.clone().add(0.5, 3, 0.5);
        // Colored particle effect for winners
        location.getWorld().spawnParticle(org.bukkit.Particle.END_ROD, fireworkLoc, 15, 0.3, 0.3, 0.3, 0.05);
        location.getWorld().playSound(fireworkLoc, "entity.firework_rocket.blast", 1.0f, 1.0f);
    }

    private void announceResults() {
        long winners = playerStatus.values().stream().filter(b -> b).count();
        long losers = playerStatus.values().stream().filter(b -> !b).count();
        long total = winners + losers;

        broadcastMessage(" ");
        broadcastMessage("§6§l ═══════ GAME RESULTS ═══════ §r");
        broadcastMessage("§7 Target Color: " + currentColor.getFormattedName());
        broadcastMessage(" ");
        broadcastMessage("§a✓ Winners: §e" + winners);
        broadcastMessage("§c✗ Losers: §e" + losers);
        broadcastMessage("§7 Total Players: §e" + total);
        
        if (winners > 0) {
            double winRate = (double) winners / total * 100;
            broadcastMessage(String.format("§7 Win Rate: §e%.1f%%", winRate));
        }
        
        broadcastMessage("§6§l ════════════════════════ §r");
        broadcastMessage(" ");

        if (winners > 0) {
            broadcastMessage("§e🎉 Congratulations to all winners!");
        } else {
            broadcastMessage("§c💔 No winners this round!");
        }
    }

    private void cleanup() {
        if (bossBar != null) {
            for (Player player : plugin.getServer().getOnlinePlayers()) {
                player.hideBossBar(bossBar);
            }
            bossBar = null;
        }

        playerStatus.clear();
        gamePhase = GamePhase.WAITING;
    }

    private void scheduleNextGame() {
        int totalSeconds = SPIN_DURATION + PREPARATION_TIME + COUNTDOWN_SECONDS;
        int minutes = totalSeconds / 60;
        plugin.getLogger().info("Next Color Wheel game in " + minutes + " minutes");
        broadcastMessage("§7 Next game in §e" + minutes + " minutes§7.");
    }

    private void createBossBar(String title, BossBar.Color color, BossBar.Overlay overlay) {
        Component component = Component.text(title.replace("§", "&"));
        
        bossBar = BossBar.bossBar(component, 1.0f, color, overlay);

        for (Player player : plugin.getServer().getOnlinePlayers()) {
            if (player.hasPermission("colorwheel.play")) {
                player.showBossBar(bossBar);
            }
        }
    }

    public void broadcastMessage(String message) {
        plugin.getServer().broadcast(Component.text(message.replace("§", "&")));
    }

    public void forceStartGame() {
        if (gamePhase != GamePhase.WAITING) {
            broadcastMessage("§c⚠ A game is already in progress! (§e" + gamePhase + "§c)");
            return;
        }
        broadcastMessage("§a▶ Force starting Color Wheel game!");
        startGame();
    }

    public void stopGame() {
        if (gameTask != null) {
            gameTask.cancel();
        }
        if (spinTask != null) {
            spinTask.cancel();
        }
        cleanup();
        gamePhase = GamePhase.STOPPED;
        broadcastMessage("§c⏹ Color Wheel game has been stopped!");
    }

    public void startGameTask() {
        if (gamePhase == GamePhase.STOPPED) {
            gamePhase = GamePhase.WAITING;
            startGameLoop();
            broadcastMessage("§a▶ Color Wheel game has been started!");
        }
    }

    public GamePhase getGamePhase() {
        return gamePhase;
    }

    public ColorEntry getCurrentColor() {
        return currentColor;
    }

    public int getCountdownSeconds() {
        return countdownSeconds;
    }

    public int getSpinDuration() {
        return SPIN_DURATION;
    }

    public int getPreparationTime() {
        return PREPARATION_TIME;
    }

    public int getFinalCountdown() {
        return COUNTDOWN_SECONDS;
    }

    public void shutdown() {
        if (gameTask != null) {
            gameTask.cancel();
        }
        if (spinTask != null) {
            spinTask.cancel();
        }
        cleanup();
    }

    public List<ColorEntry> getAllColors() {
        return colors;
    }

    public static class ColorEntry {
        private final String name;
        private final Material material;
        private final Color color;
        private final TextColor textColor;
        private final String colorCode;
        private final Set<Material> alternativeMaterials;

        public ColorEntry(String name, Material material, Color color, TextColor textColor, String colorCode) {
            this.name = name;
            this.material = material;
            this.color = color;
            this.textColor = textColor;
            this.colorCode = colorCode;
            this.alternativeMaterials = new HashSet<>();
            this.alternativeMaterials.add(material);
            
            // Add alternative blocks for each color
            addAlternativeMaterials();
        }

        private void addAlternativeMaterials() {
            // Add wool variants and other blocks of similar color
            switch (name.toUpperCase()) {
                case "RED":
                case "CRIMSON":
                    alternativeMaterials.add(Material.RED_CONCRETE);
                    alternativeMaterials.add(Material.RED_TERRACOTTA);
                    alternativeMaterials.add(Material.RED_STAINED_GLASS);
                    alternativeMaterials.add(Material.NETHER_WART_BLOCK);
                    break;
                case "ORANGE":
                case "TERRACOTTA":
                    alternativeMaterials.add(Material.ORANGE_CONCRETE);
                    alternativeMaterials.add(Material.ORANGE_TERRACOTTA);
                    break;
                case "YELLOW":
                case "GOLD":
                    alternativeMaterials.add(Material.YELLOW_CONCRETE);
                    alternativeMaterials.add(Material.YELLOW_TERRACOTTA);
                    alternativeMaterials.add(Material.HAY_BLOCK);
                    break;
                case "GREEN":
                case "EMERALD":
                    alternativeMaterials.add(Material.LIME_CONCRETE);
                    alternativeMaterials.add(Material.GREEN_TERRACOTTA);
                    alternativeMaterials.add(Material.SLIME_BLOCK);
                    break;
                case "CYAN":
                case "DIAMOND":
                    alternativeMaterials.add(Material.CYAN_CONCRETE);
                    alternativeMaterials.add(Material.CYAN_TERRACOTTA);
                    break;
                case "BLUE":
                case "LAPIS":
                case "LIGHT_BLUE":
                    alternativeMaterials.add(Material.BLUE_CONCRETE);
                    alternativeMaterials.add(Material.LIGHT_BLUE_CONCRETE);
                    alternativeMaterials.add(Material.LAPIS_BLOCK);
                    break;
                case "PURPLE":
                case "AMETHYST":
                case "MAGENTA":
                    alternativeMaterials.add(Material.PURPLE_CONCRETE);
                    alternativeMaterials.add(Material.MAGENTA_CONCRETE);
                    break;
                case "PINK":
                case "MAGMA":
                    alternativeMaterials.add(Material.PINK_CONCRETE);
                    alternativeMaterials.add(Material.PINK_TERRACOTTA);
                    break;
                case "WHITE":
                case "GRAY":
                    alternativeMaterials.add(Material.WHITE_CONCRETE);
                    alternativeMaterials.add(Material.GRAY_CONCRETE);
                    alternativeMaterials.add(Material.LIGHT_GRAY_CONCRETE);
                    alternativeMaterials.add(Material.IRON_BLOCK);
                    break;
                case "BLACK":
                    alternativeMaterials.add(Material.BLACK_CONCRETE);
                    alternativeMaterials.add(Material.COAL_BLOCK);
                    alternativeMaterials.add(Material.OBSIDIAN);
                    break;
                case "BROWN":
                    alternativeMaterials.add(Material.BROWN_CONCRETE);
                    alternativeMaterials.add(Material.BROWN_TERRACOTTA);
                    break;
            }
        }

        public String getDisplayName() {
            return name;
        }

        public String getFormattedName() {
            return colorCode + name;
        }

        public Material getMaterial() {
            return material;
        }

        public Color getColor() {
            return color;
        }

        public TextColor getTextColor() {
            return textColor;
        }

        public String getColorCode() {
            return colorCode;
        }

        public boolean matchesMaterial(Material mat) {
            return alternativeMaterials.contains(mat);
        }

        @Override
        public String toString() {
            return name;
        }
    }

    public enum GamePhase {
        WAITING("Waiting"),
        SPINNING("§6Spinning"),
        PREPARATION("§ePreparation"),
        COUNTDOWN("§cFinal Countdown"),
        ENDED("Ended"),
        STOPPED("Stopped");

        private final String displayName;

        GamePhase(String displayName) {
            this.displayName = displayName;
        }

        @Override
        public String toString() {
            return displayName;
        }
    }
}
