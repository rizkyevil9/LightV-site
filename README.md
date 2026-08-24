# LightV WhatsApp Bot

A highly modular, plugin-based WhatsApp bot architecture targeting 1000+ real features.

## Requirements
- Node.js >= 18

## Installation

1. Clone repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in configurations.
4. Run `npm start` (or `node index.js`)

## Architecture
This bot uses a plugin architecture. The core handles WhatsApp connections (Baileys), Database (SQLite), Command Parsing, and Plugin Management.
Features should be implemented as individual files inside the `plugins/` directory.

### Directory Structure
- `core/` - Core bot mechanics (bot connection, parsing, db, plugin loading)
- `config/` - Configuration settings
- `plugins/` - Feature modules (AI, Downloader, Utility, etc.)
- `data/` - SQLite database and Baileys session data
- `templates/` - Helper scripts (e.g., creating plugins)

## Plugin System

Create a new plugin using:
\`\`\`bash
npm run create-plugin -- --name=myfeature --category=utility
\`\`\`

This creates a hot-reloadable module in `plugins/utility/myfeature.js`.
