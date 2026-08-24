import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import config from '../config/index.js';
import { CommandParser } from './commandParser.js';
import pluginManager from './pluginManager.js';
import { initDb } from './database.js';

export class Bot {
  constructor() {
    this.sock = null;
    this.logger = pino({ level: 'silent' });
  }

  async start() {
    console.log('Starting LightV Bot...');

    // Initialize Database
    try {
        await initDb();
        console.log('Database initialized successfully.');
    } catch(err) {
        console.error('Failed to initialize database:', err);
        process.exit(1);
    }

    // Load Plugins
    await pluginManager.loadAll();

    const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`);

    this.sock = makeWASocket({
      version,
      logger: this.logger,
      printQRInTerminal: true,
      auth: state,
      generateHighQualityLinkPreview: true,
      browser: [config.botName, 'Chrome', '1.0.0']
    });

    const commandParser = new CommandParser(this.sock);

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('Connection closed due to', lastDisconnect.error, ', reconnecting:', shouldReconnect);
        if (shouldReconnect) {
          this.start();
        }
      } else if (connection === 'open') {
        console.log('Bot is connected and ready to receive messages.');
      }
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
          try {
            await commandParser.handleMessage(msg);
          } catch (err) {
              console.error('Fatal error handling message:', err);
          }
      }
    });
  }
}
