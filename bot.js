require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const sendDownloadedMedia = require('./helpers/sendDownloadedMedia');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const API = process.env.API
console.log('🤖 Bot is running...');

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const input = (msg.text || '').trim();

    // Validate Instagram URL
    if (!/^https?:\/\/(www\.)?instagram\.com/.test(input)) {
        return bot.sendMessage(chatId, '❌ Please send a valid Instagram post link.');
    }

    try {
        // Replace this with your API endpoint
        const apiURL = `${API}/igdl?url=${encodeURIComponent(input)}`;
        // console.log(apiURL);

        const res = await axios.get(apiURL);

        const mediaList = res.data?.url?.data;
        // console.log(mediaList);
        if (!Array.isArray(mediaList) || mediaList.length === 0) {
            return bot.sendMessage(chatId, '⚠️ No downloadable media found for this link.');
        }

        // Loop through and send each media item

        const seen = new Set();

        for (const media of mediaList) {
            if (seen.has(media.url)) continue;
            seen.add(media.url);

            const isVideo = input.includes('/reel/');
            await sendDownloadedMedia(bot, chatId, media.url, isVideo ? 'video' : 'photo');
        }
    } catch (err) {
        console.error('❌ Fetch error:', err.message);
        bot.sendMessage(chatId, '⚠️ Failed to fetch or send media.');
    }
});
