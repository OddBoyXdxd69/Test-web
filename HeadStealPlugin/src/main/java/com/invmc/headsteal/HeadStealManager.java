package com.invmc.headsteal;

import org.bukkit.configuration.file.YamlConfiguration;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class HeadStealManager {

    private final HeadStealPlugin plugin;
    private final Map<UUID, PlayerStats> stats;
    private final Map<UUID, Long> theftCooldowns;
    private File dataFile;
    private YamlConfiguration data;

    public HeadStealManager(HeadStealPlugin plugin) {
        this.plugin = plugin;
        this.stats = new HashMap<>();
        this.theftCooldowns = new HashMap<>();
        loadData();
    }

    private void loadData() {
        dataFile = new File(plugin.getDataFolder(), "data.yml");
        if (!dataFile.exists()) {
            plugin.saveResource("data.yml", false);
            if (!dataFile.exists()) {
                try {
                    dataFile.getParentFile().mkdirs();
                    dataFile.createNewFile();
                } catch (IOException e) {
                    plugin.getLogger().severe("Could not create data file: " + e.getMessage());
                }
            }
        }
        data = YamlConfiguration.loadConfiguration(dataFile);

        if (data.getConfigurationSection("players") != null) {
            for (String key : data.getConfigurationSection("players").getKeys(false)) {
                UUID uuid = UUID.fromString(key);
                int heads = data.getInt("players." + key + ".heads", 0);
                int stolen = data.getInt("players." + key + ".stolen", 0);
                int lost = data.getInt("players." + key + ".lost", 0);
                stats.put(uuid, new PlayerStats(heads, stolen, lost));
            }
        }
    }

    public void saveData() {
        for (Map.Entry<UUID, PlayerStats> entry : stats.entrySet()) {
            String key = "players." + entry.getKey().toString();
            data.set(key + ".heads", entry.getValue().getHeads());
            data.set(key + ".stolen", entry.getValue().getStolen());
            data.set(key + ".lost", entry.getValue().getLost());
        }

        try {
            data.save(dataFile);
        } catch (IOException e) {
            plugin.getLogger().severe("Could not save data file: " + e.getMessage());
        }
    }

    public PlayerStats getStats(UUID uuid) {
        return stats.computeIfAbsent(uuid, k -> new PlayerStats(0, 0, 0));
    }

    public void addHeads(UUID uuid, int amount) {
        PlayerStats playerStats = getStats(uuid);
        playerStats.setHeads(playerStats.getHeads() + amount);
    }

    public void removeHeads(UUID uuid, int amount) {
        PlayerStats playerStats = getStats(uuid);
        int newAmount = playerStats.getHeads() - amount;
        playerStats.setHeads(Math.max(0, newAmount));
    }

    public void incrementStolen(UUID uuid) {
        PlayerStats playerStats = getStats(uuid);
        playerStats.setStolen(playerStats.getStolen() + 1);
    }

    public void incrementLost(UUID uuid) {
        PlayerStats playerStats = getStats(uuid);
        playerStats.setLost(playerStats.getLost() + 1);
    }

    public int getHeadCount(UUID uuid) {
        return getStats(uuid).getHeads();
    }

    public Map<UUID, PlayerStats> getAllStats() {
        return stats;
    }

    public boolean isOnCooldown(UUID uuid) {
        Long cooldownEnd = theftCooldowns.get(uuid);
        return cooldownEnd != null && System.currentTimeMillis() < cooldownEnd;
    }

    public long getCooldownRemaining(UUID uuid) {
        Long cooldownEnd = theftCooldowns.get(uuid);
        if (cooldownEnd == null) return 0;
        return (cooldownEnd - System.currentTimeMillis()) / 1000;
    }

    public void setCooldown(UUID uuid) {
        int cooldownSeconds = plugin.getConfig().getInt("cooldowns.theft-cooldown", 0);
        if (cooldownSeconds > 0) {
            theftCooldowns.put(uuid, System.currentTimeMillis() + (cooldownSeconds * 1000L));
        }
    }

    public boolean hasEnoughHeads(UUID uuid, int amount) {
        return getHeadCount(uuid) >= amount;
    }

    public void shutdown() {
        saveData();
    }

    public static class PlayerStats {
        private int heads;
        private int stolen;
        private int lost;

        public PlayerStats(int heads, int stolen, int lost) {
            this.heads = heads;
            this.stolen = stolen;
            this.lost = lost;
        }

        public int getHeads() {
            return heads;
        }

        public void setHeads(int heads) {
            this.heads = heads;
        }

        public int getStolen() {
            return stolen;
        }

        public void setStolen(int stolen) {
            this.stolen = stolen;
        }

        public int getLost() {
            return lost;
        }

        public void setLost(int lost) {
            this.lost = lost;
        }
    }
}
