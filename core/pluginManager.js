import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.commands = new Map(); // Maps command aliases to plugin name
    this.pluginDir = path.join(__dirname, '../plugins');
  }

  async loadAll() {
    this.plugins.clear();
    this.commands.clear();
    await this.readDirectory(this.pluginDir);
    console.log(`Loaded ${this.plugins.size} plugins.`);
  }

  async readDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        await this.readDirectory(fullPath);
      } else if (file.endsWith('.js')) {
        await this.loadPlugin(fullPath);
      }
    }
  }

  async loadPlugin(filePath) {
    try {
      // Use cache busting for hot reload
      const fileUrl = pathToFileURL(filePath).href + `?update=${Date.now()}`;
      const module = await import(fileUrl);
      const plugin = module.default;

      if (!plugin || !plugin.name || !plugin.execute) {
        console.warn(`Invalid plugin format: ${filePath}`);
        return;
      }

      this.plugins.set(plugin.name, { ...plugin, filePath });

      // Register commands
      if (plugin.aliases && Array.isArray(plugin.aliases)) {
        for (const alias of plugin.aliases) {
          this.commands.set(alias, plugin.name);
        }
      } else {
         // Use name as default alias
         this.commands.set(plugin.name, plugin.name);
      }

    } catch (err) {
      console.error(`Failed to load plugin ${filePath}:`, err);
    }
  }

  getCommand(commandStr) {
    const pluginName = this.commands.get(commandStr);
    return pluginName ? this.plugins.get(pluginName) : null;
  }

  getPlugin(name) {
      return this.plugins.get(name);
  }

  async reloadPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) throw new Error(`Plugin ${name} not found`);

    const filePath = plugin.filePath;

    // Unregister old commands
    if (plugin.aliases) {
        plugin.aliases.forEach(alias => this.commands.delete(alias));
    } else {
        this.commands.delete(plugin.name);
    }

    this.plugins.delete(name);

    await this.loadPlugin(filePath);
    return true;
  }
}

// Export a singleton instance
const pluginManager = new PluginManager();
export default pluginManager;
