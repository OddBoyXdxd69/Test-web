package com.invmc.headsteal;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class HeadStealCommand implements CommandExecutor, TabCompleter {

    private final HeadStealPlugin plugin;

    public HeadStealCommand(HeadStealPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("§cThis command can only be used by players!");
            return true;
        }

        if (args.length == 0) {
            sendHelp(player);
            return true;
        }

        String subCommand = args[0].toLowerCase();

        switch (subCommand) {
            case "help" -> sendHelp(player);
            case "top" -> showLeaderboard(player);
            case "stats" -> showStats(player, args.length > 1 ? args[1] : null);
            case "bal" -> showBalance(player);
            case "setbal" -> {
                if (!player.hasPermission("headsteal.admin")) {
                    player.sendMessage("§cYou don't have permission to use this command!");
                    return true;
                }
                if (args.length < 3) {
                    player.sendMessage("§cUsage: /headsteal setbal <player> <amount>");
                    return true;
                }
                setBalance(player, args[1], args[2]);
            }
            default -> player.sendMessage(plugin.getConfig().getString("messages.unknown-command", "§cUnknown command! Use §e/headsteal help"));
        }

        return true;
    }

    private void sendHelp(Player player) {
        player.sendMessage("§6§l=== HeadSteal Help ===");
        player.sendMessage("§e/headsteal help §7- Show this help menu");
        player.sendMessage("§e/headsteal top §7- Show top head stealers");
        player.sendMessage("§e/headsteal stats [player] §7- Show head steal stats");
        player.sendMessage("§e/headsteal bal §7- Show your head balance");
        if (player.hasPermission("headsteal.admin")) {
            player.sendMessage("§e/headsteal setbal <player> <amount> §7- Set head balance");
            player.sendMessage("§e/givehead <player> §7- Give a player your head");
        }
    }

    private void showLeaderboard(Player player) {
        HeadStealManager manager = plugin.getHeadStealManager();
        int maxEntries = plugin.getConfig().getInt("leaderboard.max-entries", 10);

        List<Map.Entry<UUID, HeadStealManager.PlayerStats>> sorted = manager.getAllStats().entrySet()
            .stream()
            .sorted(Comparator.comparingInt((Map.Entry<UUID, HeadStealManager.PlayerStats> e) -> e.getValue().getStolen()).reversed())
            .limit(maxEntries)
            .toList();

        player.sendMessage("§6§l=== TOP HEAD STEALERS ===");
        player.sendMessage(" ");

        if (sorted.isEmpty()) {
            player.sendMessage("§7No heads have been stolen yet!");
            return;
        }

        for (int i = 0; i < sorted.size(); i++) {
            Map.Entry<UUID, HeadStealManager.PlayerStats> entry = sorted.get(i);
            String playerName = getPlayerName(entry.getKey());
            HeadStealManager.PlayerStats stats = entry.getValue();
            String medal = i == 0 ? "§6§l1st" : i == 1 ? "§7§l2nd" : i == 2 ? "§6§l3rd" : "§7" + (i + 1) + "th";
            player.sendMessage(medal + " §f" + playerName + " §8- §e" + stats.getStolen() + " §7heads stolen");
        }
    }

    private void showStats(Player player, String targetName) {
        HeadStealManager manager = plugin.getHeadStealManager();
        HeadStealManager.PlayerStats stats;

        if (targetName != null) {
            Player target = plugin.getServer().getPlayer(targetName);
            if (target == null) {
                player.sendMessage("§cPlayer not found!");
                return;
            }
            stats = manager.getStats(target.getUniqueId());
        } else {
            stats = manager.getStats(player.getUniqueId());
        }

        player.sendMessage("§6§l=== HEAD STEAL STATS ===");
        player.sendMessage("§eHeads: §f" + stats.getHeads());
        player.sendMessage("§eHeads Stolen: §f" + stats.getStolen());
        player.sendMessage("§eHeads Lost: §f" + stats.getLost());
    }

    private void showBalance(Player player) {
        HeadStealManager manager = plugin.getHeadStealManager();
        int heads = manager.getHeadCount(player.getUniqueId());
        player.sendMessage("§6§l=== YOUR HEAD BALANCE ===");
        player.sendMessage("§eYou have §f" + heads + " §eheads");
    }

    private void setBalance(Player player, String targetName, String amountStr) {
        Player target = plugin.getServer().getPlayer(targetName);
        if (target == null) {
            player.sendMessage("§cPlayer not found!");
            return;
        }

        try {
            int amount = Integer.parseInt(amountStr);
            if (amount < 0) {
                player.sendMessage("§cAmount cannot be negative!");
                return;
            }
            plugin.getHeadStealManager().getStats(target.getUniqueId()).setHeads(amount);
            player.sendMessage("§aSet §e" + target.getName() + "§a's head balance to §e" + amount);
        } catch (NumberFormatException e) {
            player.sendMessage("§cInvalid amount!");
        }
    }

    private String getPlayerName(UUID uuid) {
        Player player = plugin.getServer().getPlayer(uuid);
        if (player != null) {
            return player.getName();
        }
        return plugin.getServer().getOfflinePlayer(uuid).getName();
    }

    @Override
    public @Nullable List<String> onTabComplete(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (args.length == 1) {
            List<String> completions = new ArrayList<>();
            List<String> commands = Arrays.asList("help", "top", "stats", "bal");

            if (sender.hasPermission("headsteal.admin")) {
                commands = Arrays.asList("help", "top", "stats", "bal", "setbal");
            }

            for (String cmd : commands) {
                if (cmd.startsWith(args[0].toLowerCase())) {
                    completions.add(cmd);
                }
            }

            return completions;
        }

        return new ArrayList<>();
    }
}
