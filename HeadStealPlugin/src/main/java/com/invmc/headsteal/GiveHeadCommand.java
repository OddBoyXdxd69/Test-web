package com.invmc.headsteal;

import net.kyori.adventure.text.Component;
import org.bukkit.Material;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.SkullMeta;
import org.jetbrains.annotations.NotNull;

public class GiveHeadCommand implements CommandExecutor {

    private final HeadStealPlugin plugin;

    public GiveHeadCommand(HeadStealPlugin plugin) {
        this.plugin = plugin;
    }

    @Override
    public boolean onCommand(@NotNull CommandSender sender, @NotNull Command command, @NotNull String label, @NotNull String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("§cThis command can only be used by players!");
            return true;
        }

        if (!player.hasPermission("headsteal.admin")) {
            player.sendMessage(plugin.getConfig().getString("messages.no-permission", "§cYou don't have permission to use this command!"));
            return true;
        }

        if (args.length < 1) {
            player.sendMessage("§cUsage: /givehead <player>");
            return true;
        }

        Player target = plugin.getServer().getPlayer(args[0]);
        if (target == null) {
            player.sendMessage("§cPlayer not found!");
            return true;
        }

        ItemStack head = new ItemStack(Material.PLAYER_HEAD, 1);
        SkullMeta meta = (SkullMeta) head.getItemMeta();
        if (meta != null) {
            meta.setOwningPlayer(player);
            String message = plugin.getConfig().getString("messages.head-message", "&6&lHeadSteal &7- Player &e%player%&7's head")
                .replace("%player%", player.getName());
            meta.displayName(Component.text(message.replace("§", "&")));
            head.setItemMeta(meta);
        }

        target.getInventory().addItem(head);
        player.sendMessage("§aYou gave your head to §e" + target.getName());
        target.sendMessage("§aYou received §e" + player.getName() + "§a's head!");

        return true;
    }
}
