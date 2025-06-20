// bot.js
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import sendDownloadedMedia from './helpers/sendDownloadedMedia.js';

dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
console.log('🤖 Bot is running');

bot.on('message', async (msg) => {
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
});
