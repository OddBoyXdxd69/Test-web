package com.invmc.headsteal;

import net.milkbowl.vault.economy.Economy;
import org.bukkit.plugin.RegisteredServiceProvider;
import org.bukkit.plugin.java.JavaPlugin;

public final class HeadStealPlugin extends JavaPlugin {

    private static final String VERSION = "1.0.0";
    private static final String OWNER = "OddBoyXD";
    private static final String REPO = "OddBoyXdxd69/Test-web";

    private HeadStealManager headStealManager;
    private HeadStealListener headStealListener;
    private UpdateChecker updateChecker;
    private Economy economy;

    @Override
    public void onEnable() {
        saveDefaultConfig();

        headStealManager = new HeadStealManager(this);
        headStealListener = new HeadStealListener(this);
        updateChecker = new UpdateChecker(this, REPO, VERSION);

        setupEconomy();

        getServer().getPluginManager().registerEvents(headStealListener, this);

        getCommand("headsteal").setExecutor(new HeadStealCommand(this));
        getCommand("givehead").setExecutor(new GiveHeadCommand(this));

        getLogger().info("╔════════════════════════════════════╗");
        getLogger().info("║      HeadStealPlugin Enabled!      ║");
        getLogger().info("║           Version: " + String.format("%-14s", VERSION) + " ║");
        getLogger().info("║           Owner: " + String.format("%-16s", OWNER) + " ║");
        getLogger().info("╚════════════════════════════════════╝");
        getLogger().info("");

        if (economy != null) {
            getLogger().info("✓ Economy integration found: " + economy.getName());
        } else {
            getLogger().info("! Economy plugin not found - rewards disabled");
        }

        updateChecker.checkForUpdates(true);
        scheduleUpdateChecks();
    }

    @Override
    public void onDisable() {
        if (headStealManager != null) {
            headStealManager.shutdown();
        }
        if (updateChecker != null) {
            updateChecker.shutdown();
        }
        getLogger().info("HeadStealPlugin by " + OWNER + " has been disabled!");
    }

    private boolean setupEconomy() {
        if (!getConfig().getBoolean("economy.enabled", true)) {
            return false;
        }

        if (getServer().getPluginManager().getPlugin("Vault") == null) {
            return false;
        }

        RegisteredServiceProvider<Economy> rsp = getServer().getServicesManager().getRegistration(Economy.class);
        if (rsp == null) {
            return false;
        }

        economy = rsp.getProvider();
        return economy != null;
    }

    private void scheduleUpdateChecks() {
        long hourInTicks = 20L * 60 * 60;

        getServer().getScheduler().runTaskTimerAsynchronously(this, () -> {
            updateChecker.checkForUpdates(false);
        }, hourInTicks, hourInTicks);

        getLogger().info("Auto-update checks scheduled every hour.");
    }

    public HeadStealManager getHeadStealManager() {
        return headStealManager;
    }

    public HeadStealListener getHeadStealListener() {
        return headStealListener;
    }

    public UpdateChecker getUpdateChecker() {
        return updateChecker;
    }

    public Economy getEconomy() {
        return economy;
    }

    public static String getOwner() {
        return OWNER;
    }

    public static String getVersion() {
        return VERSION;
    }
}
