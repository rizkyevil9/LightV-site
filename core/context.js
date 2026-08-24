import config from '../config/index.js';

export class Context {
  constructor(sock, msg, type) {
    this.sock = sock;
    this.msg = msg;
    this.type = type;

    // Standard properties
    this.key = msg.key;
    this.id = msg.key.id;
    this.from = msg.key.remoteJid;
    this.isGroup = this.from.endsWith('@g.us');
    this.sender = this.isGroup ? msg.key.participant : this.from;

    // Check permissions
    this.isOwner = config.ownerNumbers.includes(this.sender);
    // this.isAdmin will be populated in command parser after fetching group metadata

    // Extract text from various message types
    this.text = msg.message?.conversation ||
                msg.message?.extendedTextMessage?.text ||
                msg.message?.imageMessage?.caption ||
                msg.message?.videoMessage?.caption ||
                '';

    // Parse command and args (will be populated by parser)
    this.command = '';
    this.args = [];
    this.fullArgs = '';
  }

  // Reply helper
  async reply(text) {
    return await this.sock.sendMessage(this.from, { text: text }, { quoted: this.msg });
  }

  // React helper
  async react(emoji) {
    return await this.sock.sendMessage(this.from, { react: { text: emoji, key: this.key } });
  }

  // Send Image helper
  async sendImage(urlOrBuffer, caption = '') {
    const isUrl = typeof urlOrBuffer === 'string' && urlOrBuffer.startsWith('http');
    const imageMsg = isUrl ? { url: urlOrBuffer } : urlOrBuffer;
    return await this.sock.sendMessage(this.from, { image: imageMsg, caption }, { quoted: this.msg });
  }

  // Send Video helper
  async sendVideo(urlOrBuffer, caption = '') {
    const isUrl = typeof urlOrBuffer === 'string' && urlOrBuffer.startsWith('http');
    const videoMsg = isUrl ? { url: urlOrBuffer } : urlOrBuffer;
    return await this.sock.sendMessage(this.from, { video: videoMsg, caption }, { quoted: this.msg });
  }
}
