// helpers/sendDownloadedMedia.js
const fs = require('fs');
const path = require('path');
const downloadFile = require('./downloadFile');

async function sendDownloadedMedia(bot, chatId, mediaUrl, type = 'photo') {
  try {
    const extension = type === 'video' ? '.mp4' : '.jpg';
    const filepath = await downloadFile(mediaUrl, extension);

    const stream = fs.createReadStream(filepath);

    if (type === 'video') {
      await bot.sendVideo(chatId, stream);
    } else {
      await bot.sendPhoto(chatId, stream);
    }

    // Commented out for debugging; you can enable it later
    fs.unlinkSync(filepath);
  } catch (err) {
    console.error('❌ sendDownloadedMedia error:', err.message);
    await bot.sendMessage(chatId, `⚠️ Failed to send media.\n${mediaUrl}`);
  }
}

module.exports = sendDownloadedMedia;
