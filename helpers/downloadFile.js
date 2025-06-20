// helpers/downloadFile.js
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

async function downloadFile(url, extension = '.jpg') {
  const filename = `${uuidv4()}${extension}`;
  const dir = path.join(__dirname, '..', 'downloads');
  const filepath = path.join(dir, filename);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(filepath);
  response.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return filepath;
}

module.exports = downloadFile;
