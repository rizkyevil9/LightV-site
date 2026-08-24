import { Bot } from './core/bot.js';

const bot = new Bot();

// Handle unhandled promise rejections to prevent crash
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

bot.start().catch(err => {
    console.error('Failed to start bot:', err);
});
