// server.js
import dotenv from 'dotenv';
import express from 'express';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import sendDownloadedMedia from './helpers/sendDownloadedMedia.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize bot without polling (webhook mode)
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: false });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: 'Instagram Bot is running!',
        timestamp: new Date().toISOString()
    });
});

// Health check for Render.com
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Webhook endpoint for Telegram
app.post('/webhook', async (req, res) => {
    try {
        const update = req.body;

        // Handle the update
        if (update.message) {
            await handleMessage(update.message);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});

// Message handler function
async function handleMessage(msg) {
    const chatId = msg.chat.id;
    const input = (msg.text || '').trim();

    if (!/^https?:\/\/.*instagram\.com/.test(input)) {
        return bot.sendMessage(chatId, 'Please send a valid Instagram post link.');
    }

    await bot.sendMessage(chatId, '⏳ Media is loading, please wait...');

    try {
        const apiURL = `${process.env.API}/igdl?url=${encodeURIComponent(input)}`;
        const res = await axios.get(apiURL);
        const mediaList = res.data?.url?.data;

        if (!Array.isArray(mediaList) || mediaList.length === 0) {
            return bot.sendMessage(chatId, '⚠️ No downloadable media found.');
        }

        const uniqueMedia = [...new Set(mediaList.map(m => m.url))];

        for (const mediaUrl of uniqueMedia) {
            await sendDownloadedMedia(bot, chatId, mediaUrl);
        }
    } catch (err) {
        console.error('❌ Fetch error:', err.message);
        bot.sendMessage(chatId, '❌ Failed to fetch or send media.');
    }
}

// Set webhook on startup
async function setWebhook() {
    try {
        const webhookUrl = `${process.env.WEBHOOK_URL}/webhook`;
        await bot.setWebHook(webhookUrl);
        console.log(`✅ Webhook set to: ${webhookUrl}`);
    } catch (error) {
        console.error('❌ Failed to set webhook:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // For local development with localhost, use polling instead of webhook
    if (process.env.NODE_ENV === 'development' || process.env.WEBHOOK_URL?.includes('localhost')) {
        console.log('🔄 Starting polling for local development...');
        bot.startPolling();

        // Handle messages for polling mode
        bot.on('message', handleMessage);
    } else if (process.env.WEBHOOK_URL) {
        await setWebhook();
    } else {
        console.warn('⚠️ WEBHOOK_URL not set. Please set it in your environment variables.');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});