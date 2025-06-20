// helpers/getMediaType.js
import { fileTypeFromStream } from 'file-type';
import axios from 'axios';

export async function getMediaTypeAndExtension(url) {
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    const fileType = await fileTypeFromStream(response.data);

    if (!fileType) return { type: 'unknown', extension: '.bin' };

    const mime = fileType.mime;
    const ext = '.' + fileType.ext;

    if (mime.startsWith('image')) return { type: 'photo', extension: ext };
    if (mime.startsWith('video')) return { type: 'video', extension: ext };

    return { type: 'unknown', extension: ext };
  } catch (err) {
    console.error('getMediaType error:', err.message);
    return { type: 'unknown', extension: '.bin' };
  }
}