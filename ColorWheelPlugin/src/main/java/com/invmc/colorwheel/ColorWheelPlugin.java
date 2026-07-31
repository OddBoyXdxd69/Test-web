package com.invmc.colorwheel;

import org.bukkit.plugin.java.JavaPlugin;

public final class ColorWheelPlugin extends JavaPlugin {

    private static final String VERSION = "1.0.0";
    private static final String OWNER = "OddBoyXD";
    private static final String REPO = "OddBoyXdxd69/Test-web";
    
    private GameManager gameManager;
    private UpdateChecker updateChecker;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        
        gameManager = new GameManager(this);
        updateChecker = new UpdateChecker(this, REPO, VERSION);
        
        getCommand("colorwheel").setExecutor(new ColorWheelCommand(this));
        
        getLogger().info("╔════════════════════════════════════╗");
        getLogger().info("║     ColorWheelPlugin Enabled!      ║");
        getLogger().info("║           Version: " + String.format("%-14s", VERSION) + " ║");
        getLogger().info("║           Owner: " + String.format("%-16s", OWNER) + " ║");
        getLogger().info("╚════════════════════════════════════╝");
        getLogger().info("");
        getLogger().info("Color wheel game will run every 2.5 minutes automatically.");
        getLogger().info("Checking for updates...");
        
        // Check for updates on startup
        updateChecker.checkForUpdates(true);
        
        // Schedule hourly update checks
        scheduleUpdateChecks();
    }

    @Override
    public void onDisable() {
        if (gameManager != null) {
            gameManager.shutdown();
        }
        if (updateChecker != null) {
            updateChecker.shutdown();
        }
        getLogger().info("ColorWheelPlugin by " + OWNER + " has been disabled!");
    }

    private void scheduleUpdateChecks() {
        // Check for updates every hour (20 ticks * 60 seconds * 60 minutes = 72000 ticks)
        long hourInTicks = 20L * 60 * 60;
        
        getServer().getScheduler().runTaskTimerAsynchronously(this, () -> {
            updateChecker.checkForUpdates(false);
        }, hourInTicks, hourInTicks);
        
        getLogger().info("Auto-update checks scheduled every hour.");
    }

    public GameManager getGameManager() {
        return gameManager;
    }
    
    public UpdateChecker getUpdateChecker() {
        return updateChecker;
    }
    
    public static String getOwner() {
        return OWNER;
    }
    
    public static String getVersion() {
        return VERSION;
    }
}
