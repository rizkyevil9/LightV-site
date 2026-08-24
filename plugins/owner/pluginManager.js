import pluginManager from '../../core/pluginManager.js';

export default {
  name: "pluginManager",
  category: "owner",
  aliases: ["plugin", "pl"],
  description: "Manage bot plugins (reload, list)",
  usage: "plugin <reload|list> [pluginName]",

  permissions: ["owner"],

  async execute(ctx) {
    if (ctx.args.length === 0) {
      return ctx.reply("Usage: plugin <reload|list> [pluginName]");
    }

    const action = ctx.args[0].toLowerCase();

    if (action === "list") {
      const plugins = Array.from(pluginManager.plugins.values());
      const activeCount = plugins.length;
      let msg = `*Active Plugins (${activeCount}):*\n\n`;

      const categories = {};
      for (const pl of plugins) {
          const cat = pl.category || 'uncategorized';
          if (!categories[cat]) categories[cat] = [];
          categories[cat].push(pl.name);
      }

      for (const cat in categories) {
          msg += `*[ ${cat.toUpperCase()} ]*\n`;
          msg += categories[cat].join(', ') + '\n\n';
      }

      return ctx.reply(msg.trim());
    }

    if (action === "reload") {
      if (ctx.args.length < 2) return ctx.reply("Please provide a plugin name to reload.");
      const pluginName = ctx.args[1];

      try {
        await pluginManager.reloadPlugin(pluginName);
        return ctx.reply(`✅ Plugin '${pluginName}' reloaded successfully.`);
      } catch (e) {
        return ctx.reply(`❌ Failed to reload plugin '${pluginName}': ${e.message}`);
      }
    }

    return ctx.reply("Unknown action. Available: list, reload.");
  }
};
