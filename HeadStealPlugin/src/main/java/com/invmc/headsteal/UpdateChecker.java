package com.invmc.headsteal;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import org.bukkit.Bukkit;
import org.bukkit.scheduler.BukkitRunnable;
import org.bukkit.scheduler.BukkitTask;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Level;

public class UpdateChecker {

    private final HeadStealPlugin plugin;
    private final String repository;
    private final String currentVersion;
    private BukkitTask checkTask;
    private boolean isChecking = false;

    public UpdateChecker(HeadStealPlugin plugin, String repository, String currentVersion) {
        this.plugin = plugin;
        this.repository = repository;
        this.currentVersion = currentVersion;
    }

    public void checkForUpdates(boolean notifyConsole) {
        if (isChecking) {
            return;
        }

        isChecking = true;

        Bukkit.getScheduler().runTaskAsynchronously(plugin, () -> {
            try {
                String latestVersion = getLatestVersion();

                if (latestVersion != null) {
                    compareVersions(latestVersion, notifyConsole);
                }
            } catch (Exception e) {
                if (notifyConsole) {
                    plugin.getLogger().warning("Failed to check for updates: " + e.getMessage());
                }
            } finally {
                isChecking = false;
            }
        });
    }

    private String getLatestVersion() throws Exception {
        URL url = new URL("https://api.github.com/repos/" + repository + "/releases/latest");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestProperty("User-Agent", "HeadStealPlugin/" + currentVersion);
        connection.setRequestProperty("Accept", "application/vnd.github.v3+json");

        int responseCode = connection.getResponseCode();

        if (responseCode == HttpURLConnection.HTTP_FORBIDDEN) {
            return getLatestVersionFromTags();
        }

        if (responseCode != HttpURLConnection.HTTP_OK) {
            return null;
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
        StringBuilder response = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();

        JsonObject json = JsonParser.parseString(response.toString()).getAsJsonObject();
        return json.get("tag_name").getAsString();
    }

    private String getLatestVersionFromTags() throws Exception {
        URL url = new URL("https://api.github.com/repos/" + repository + "/tags");
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setRequestProperty("User-Agent", "HeadStealPlugin/" + currentVersion);
        connection.setRequestProperty("Accept", "application/vnd.github.v3+json");

        if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
            return null;
        }

        BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
        StringBuilder response = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            response.append(line);
        }
        reader.close();

        var jsonArray = JsonParser.parseString(response.toString()).getAsJsonArray();
        if (jsonArray.size() > 0) {
            return jsonArray.get(0).getAsJsonObject().get("name").getAsString();
        }

        return null;
    }

    private void compareVersions(String latestVersion, boolean notifyConsole) {
        if (isVersionOlder(currentVersion, latestVersion)) {
            String updateMessage = """

                ╔═══════════════════════════════════════════════════╗
                ║          🔄 UPDATE AVAILABLE!                      ║
                ╠═══════════════════════════════════════════════════╣
                ║  Current Version: %-25s           ║
                ║  Latest Version:  %-26s          ║
                ╠═══════════════════════════════════════════════════╣
                ║  Download: https://github.com/%-25s ║
                ╚═══════════════════════════════════════════════════╝
                """.formatted(
                currentVersion,
                latestVersion + "!",
                repository + "/releases"
            );

            if (notifyConsole) {
                plugin.getLogger().info(updateMessage);
            }

            new BukkitRunnable() {
                @Override
                public void run() {
                    for (var player : plugin.getServer().getOnlinePlayers()) {
                        if (player.hasPermission("headsteal.update")) {
                            player.sendMessage("§6§l[HeadSteal] §eA new version is available! (§f" + latestVersion + "§e)");
                            player.sendMessage("§7Download: §bhttps://github.com/" + repository + "/releases");
                        }
                    }
                }
            }.runTask(plugin);

        } else {
            if (notifyConsole) {
                plugin.getLogger().info("✓ Plugin is up to date! (v" + currentVersion + ")");
            }
        }
    }

    private boolean isVersionOlder(String current, String latest) {
        try {
            String currentClean = current.replace("v", "").replace("V", "");
            String latestClean = latest.replace("v", "").replace("V", "");

            String[] currentParts = currentClean.split("\\.");
            String[] latestParts = latestClean.split("\\.");

            for (int i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
                int currentNum = i < currentParts.length ? Integer.parseInt(currentParts[i]) : 0;
                int latestNum = i < latestParts.length ? Integer.parseInt(latestParts[i]) : 0;

                if (latestNum > currentNum) {
                    return true;
                }
                if (latestNum < currentNum) {
                    return false;
                }
            }

            return false;
        } catch (Exception e) {
            plugin.getLogger().log(Level.WARNING, "Error comparing versions", e);
            return false;
        }
    }

    public void shutdown() {
        if (checkTask != null) {
            checkTask.cancel();
        }
    }
}
