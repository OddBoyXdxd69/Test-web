package com.invmc.colorwheel;

import org.bukkit.plugin.java.JavaPlugin;

public final class ColorWheelPlugin extends JavaPlugin {

    private GameManager gameManager;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        
        gameManager = new GameManager(this);
        
        getCommand("colorwheel").setExecutor(new ColorWheelCommand(this));
        
        getLogger().info("ColorWheelPlugin has been enabled!");
        getLogger().info("Color wheel game will run every 2 minutes automatically.");
    }

    @Override
    public void onDisable() {
        if (gameManager != null) {
            gameManager.shutdown();
        }
        getLogger().info("ColorWheelPlugin has been disabled!");
    }

    public GameManager getGameManager() {
        return gameManager;
    }
}
