package com.invmc.colorwheel;

import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;
import org.bukkit.entity.Player;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ColorWheelCommand implements CommandExecutor, TabCompleter {

    private final ColorWheelPlugin plugin;

    public ColorWheelCommand(ColorWheelPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (args.length == 0) {
            sendHelp(sender);
            return true;
        }

        String subCommand = args[0].toLowerCase();

        switch (subCommand) {
            case "start" -> {
                if (!sender.hasPermission("colorwheel.admin")) {
                    sender.sendMessage("§cYou don't have permission to use this command!");
                    return true;
                }
                plugin.getGameManager().startGameTask();
                sender.sendMessage("§aColor Wheel game started!");
            }
            case "stop" -> {
                if (!sender.hasPermission("colorwheel.admin")) {
                    sender.sendMessage("§cYou don't have permission to use this command!");
                    return true;
                }
                plugin.getGameManager().stopGame();
                sender.sendMessage("§cColor Wheel game stopped!");
            }
            case "force" -> {
                if (!sender.hasPermission("colorwheel.admin")) {
                    sender.sendMessage("§cYou don't have permission to use this command!");
                    return true;
                }
                plugin.getGameManager().forceStartGame();
                sender.sendMessage("§eForce starting Color Wheel game!");
            }
            case "info" -> {
                showInfo(sender);
            }
            case "reload" -> {
                if (!sender.hasPermission("colorwheel.admin")) {
                    sender.sendMessage("§cYou don't have permission to use this command!");
                    return true;
                }
                plugin.reloadConfig();
                sender.sendMessage("§aConfiguration reloaded!");
            }
            case "colors" -> {
                showColors(sender);
            }
            default -> {
                sender.sendMessage("§cUnknown command! Use §e/colorwheel help §cfor more information.");
            }
        }

        return true;
    }

    private void sendHelp(CommandSender sender) {
        sender.sendMessage("§6§l=== Color Wheel Help ===");
        sender.sendMessage("§e/colorwheel start §7- Start the game loop");
        sender.sendMessage("§e/colorwheel stop §7- Stop the game loop");
        sender.sendMessage("§e/colorwheel force §7- Force start a game immediately");
        sender.sendMessage("§e/colorwheel info §7- Show current game status");
        sender.sendMessage("§e/colorwheel colors §7- List all available colors");
        sender.sendMessage("§e/colorwheel reload §7- Reload configuration");
    }

    private void showInfo(CommandSender sender) {
        GameManager gameManager = plugin.getGameManager();

        sender.sendMessage("§6§l=== Color Wheel Status ===");
        sender.sendMessage("§7Phase: §e" + gameManager.getGamePhase());

        if (gameManager.getCurrentColor() != null) {
            sender.sendMessage("§7Target Color: " + gameManager.getCurrentColor().getFormattedName());
        }

        sender.sendMessage("§7Spin Duration: §e" + gameManager.getSpinDuration() + " seconds");
        sender.sendMessage("§7Preparation: §e" + gameManager.getPreparationTime() + " seconds§7 (2 minutes)");
        sender.sendMessage("§7Final Countdown: §e" + gameManager.getFinalCountdown() + " seconds");
    }

    private void showColors(CommandSender sender) {
        sender.sendMessage("§6§l=== All Color Wheel Colors ===");
        sender.sendMessage("§7Total colors: §e" + plugin.getGameManager().getAllColors().size());
        sender.sendMessage(" ");
        
        for (GameManager.ColorEntry color : plugin.getGameManager().getAllColors()) {
            sender.sendMessage(color.getColorCode() + "● " + color.getDisplayName() + 
                             " §7- " + color.getMaterial().name().replace("_", " ").toLowerCase());
        }
    }

    @Override
    public @Nullable List<String> onTabComplete(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (args.length == 1) {
            List<String> completions = new ArrayList<>();
            List<String> commands = Arrays.asList("start", "stop", "force", "info", "colors", "reload", "help");

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
