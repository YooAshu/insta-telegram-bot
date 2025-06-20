// helpers/sendDownloadedMedia.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import downloadFile from './downloadFile.js';
import { getMediaTypeAndExtension } from './getMediaType.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function sendDownloadedMedia(bot, chatId, mediaUrl) {
  try {
    // 1️⃣ detect true type
    const { type, extension } = await getMediaTypeAndExtension(mediaUrl);
    if (type === 'unknown') {
      return bot.sendMessage(chatId, `⚠️ Unknown media type: ${mediaUrl}`);
    }

    // 2️⃣ download with correct extension
    const filepath = await downloadFile(mediaUrl, extension);
    // console.log('Saved:', path.basename(filepath), '-', type);

    // 3️⃣ send via Telegram (path string = safest)
    if (type === 'video') {
      await bot.sendVideo(chatId, filepath);
    } else {
      await bot.sendPhoto(chatId, filepath);
    }

    // 4️⃣ cleanup after sending
    try {
      fs.unlinkSync(filepath);
    //   console.log('Cleaned up:', path.basename(filepath));
    } catch (cleanupErr) {
      console.warn('Cleanup failed:', cleanupErr.message);
    }
  } catch (err) {
    console.error('❌ sendDownloadedMedia error:', err.message);
    bot.sendMessage(chatId, `⚠️ Could not send media:\n${mediaUrl}`);
  }
}
