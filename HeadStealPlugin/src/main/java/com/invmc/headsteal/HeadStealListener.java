package com.invmc.headsteal;

import net.kyori.adventure.text.Component;
import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.Sound;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.PlayerRespawnEvent;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.SkullMeta;

import java.util.Random;
import java.util.UUID;

public class HeadStealListener implements Listener {

    private final HeadStealPlugin plugin;
    private final Random random = new Random();

    public HeadStealListener(HeadStealPlugin plugin) {
        this.plugin = plugin;
    }

    @EventHandler
    public void onPlayerDeath(PlayerDeathEvent event) {
        Player victim = event.getEntity();
        Player killer = victim.getKiller();

        boolean isPvP = killer != null;
        int dropChance = getDropChance(isPvP);

        // Victim's head drops on death
        if (plugin.getConfig().getBoolean("drops.death-drop", true) && rollChance(dropChance)) {
            ItemStack head = createPlayerHead(victim);
            event.getDrops().add(head);

            HeadStealManager.PlayerStats victimStats = plugin.getHeadStealManager().getStats(victim.getUniqueId());
            victimStats.setLost(victimStats.getLost() + 1);
        }

        // Killer gets the head
        if (isPvP && plugin.getConfig().getBoolean("drops.killer-gets-head", true) && rollChance(dropChance)) {
            ItemStack head = createPlayerHead(victim);
            giveHeadToKiller(killer, head, victim);
        }
    }

    private int getDropChance(boolean isPvP) {
        if (isPvP) {
            return plugin.getConfig().getInt("drops.pvp-death-chance", 100);
        }
        return plugin.getConfig().getInt("drops.mob-death-chance", 10);
    }

    private boolean rollChance(int chance) {
        return chance >= 100 || random.nextInt(100) < chance;
    }

    private void giveHeadToKiller(Player killer, ItemStack head, Player victim) {
        UUID killerId = killer.getUniqueId();
        HeadStealManager manager = plugin.getHeadStealManager();

        if (manager.isOnCooldown(killerId)) {
            long remaining = manager.getCooldownRemaining(killerId);
            sendMessage(killer, plugin.getConfig().getString("messages.on-cooldown", "&cYou need to wait &e%time%s &cbefore stealing another head!")
                .replace("%time%", String.valueOf(remaining)));
            return;
        }

        manager.setCooldown(killerId);
        manager.incrementStolen(killerId);

        if (plugin.getConfig().getBoolean("drops.killer-gets-head", true)) {
            killer.getInventory().addItem(head);
        }

        sendMessage(killer, plugin.getConfig().getString("messages.head-stolen", "&a✓ You stole &e%victim%&a's head!")
            .replace("%victim%", victim.getName()));

        if (victim.isOnline()) {
            sendMessage(victim, plugin.getConfig().getString("messages.head-lost", "&c✗ &e%killer% &cstole your head!")
                .replace("%killer%", killer.getName()));
        }

        // Play sounds
        killer.playSound(killer.getLocation(), Sound.ENTITY_PLAYER_LEVELUP, 1.0f, 1.0f);
        victim.playSound(victim.getLocation(), Sound.ENTITY_WITHER_HURT, 1.0f, 1.0f);

        // Economy rewards
        rewardEconomy(killer);
    }

    private void rewardEconomy(Player killer) {
        if (plugin.getEconomy() == null) return;

        int reward = plugin.getConfig().getInt("economy.reward-per-head", 100);
        plugin.getEconomy().depositPlayer(killer, reward);

        killer.sendMessage(Component.text("§6§l[HeadSteal] §a+$" + reward + " for stealing a head!"));
    }

    private ItemStack createPlayerHead(Player player) {
        ItemStack head = new ItemStack(Material.PLAYER_HEAD, 1);
        SkullMeta meta = (SkullMeta) head.getItemMeta();

        if (meta != null) {
            meta.setOwningPlayer(player);
            String message = plugin.getConfig().getString("messages.head-message", "&6&lHeadSteal &7- Player &e%player%&7's head")
                .replace("%player%", player.getName());
            meta.displayName(Component.text(message.replace("§", "&")));
            head.setItemMeta(meta);
        }

        return head;
    }

    @EventHandler
    public void onPlayerRespawn(PlayerRespawnEvent event) {
        // Nothing needed here for now
    }

    private void sendMessage(Player player, String message) {
        String prefix = plugin.getConfig().getString("messages.prefix", "&6&lHeadSteal &r&8» &r");
        player.sendMessage(Component.text((prefix + message).replace("§", "&")));
    }
}
