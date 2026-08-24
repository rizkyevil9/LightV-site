import config from '../config/index.js';
import { Context } from './context.js';
import pluginManager from './pluginManager.js';
import { getUser, addUser } from './database.js';

export class CommandParser {
  constructor(sock) {
    this.sock = sock;
  }

  async handleMessage(msg) {
    if (!msg.message || msg.key.fromMe) return; // Ignore own messages for now

    const type = Object.keys(msg.message)[0];
    if (type === 'ephemeralMessage') return; // Ignore ephemeral wrapper for now (should unwrap in real scenario)
    if (type === 'senderKeyDistributionMessage') return;
    if (type === 'messageContextInfo') return;

    const ctx = new Context(this.sock, msg, type);

    // Ensure user exists in DB
    try {
        let user = await getUser(ctx.sender);
        if (!user) {
            await addUser(ctx.sender);
            user = await getUser(ctx.sender);
        }
        ctx.user = user;
    } catch (e) {
        console.error('Error fetching/adding user to DB:', e);
    }

    const escapedPrefix = config.prefix.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
    const prefixRegex = new RegExp(`^[${escapedPrefix}]\\s*([^\\s]+)(?:\\s+(.*))?$`, "i");

    // Check if the message starts with prefix
    const match = ctx.text.match(prefixRegex);
    if (!match) return;

    ctx.command = match[1].toLowerCase();
    ctx.fullArgs = match[2] || '';
    ctx.args = ctx.fullArgs.split(/\\s+/).filter(v => v !== '');

    // Fetch Group Metadata if needed for admin checks
    ctx.isAdmin = false;
    ctx.isBotAdmin = false;
    if (ctx.isGroup) {
      try {
        const groupMetadata = await this.sock.groupMetadata(ctx.from);
        const participants = groupMetadata.participants;
        const botId = this.sock.user.id.split(':')[0] + '@s.whatsapp.net';

        ctx.isAdmin = participants.some(p => p.id === ctx.sender && (p.admin === 'admin' || p.admin === 'superadmin'));
        ctx.isBotAdmin = participants.some(p => p.id === botId && (p.admin === 'admin' || p.admin === 'superadmin'));
      } catch (err) {
        console.error('Error fetching group metadata:', err);
      }
    }

    // Route to plugin
    const plugin = pluginManager.getCommand(ctx.command);
    if (plugin) {
      if (plugin.permissions) {
        if (plugin.permissions.includes('owner') && !ctx.isOwner) {
          return ctx.reply('Fitur ini hanya untuk Owner bot.');
        }
        if (plugin.permissions.includes('admin') && !ctx.isAdmin && !ctx.isOwner) {
          return ctx.reply('Fitur ini hanya untuk Admin grup.');
        }
        if (plugin.permissions.includes('group') && !ctx.isGroup) {
          return ctx.reply('Fitur ini hanya dapat digunakan di dalam grup.');
        }
      }

      try {
        await plugin.execute(ctx);
      } catch (err) {
        console.error(`Error executing plugin ${plugin.name}:`, err);
        ctx.reply(`Plugin failed: ${plugin.name}\\nError: ${err.message}`);
      }
    }
  }
}
