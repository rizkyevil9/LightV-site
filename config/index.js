import dotenv from 'dotenv';

import fs from 'fs';

// Check if .env exists, if not fallback to defaults or process.env
if (fs.existsSync('.env')) {
  dotenv.config();
}

export default {
  botName: process.env.BOT_NAME || 'LightV',
  prefix: process.env.PREFIX || '.',
  // Support multiple owners separated by comma
  ownerNumbers: process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER.split(',').map(n => n.trim() + '@s.whatsapp.net') : [],
  sessionDir: process.env.SESSION_DIR || './data/session',
  databaseUrl: process.env.DATABASE_URL || './data/database.db',
  aiApiKey: process.env.AI_API_KEY || ''
};
