const fs = require('fs');

class StorageService {
  constructor(directory) {
    this._directory = directory;

    if (!fs.existsSync(this._directory)) {
      fs.mkdirSync(this._directory, {recursive: true});
    }
  }

  writeFile(file, meta) {
    const filename = +new Date() + meta.filename;
    const path = `${this._directory}/${filename}`;

    const fileStream = fs.createWriteStream(path);

    return new Promise((resolve, reject) => {
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      file.on('end', () => resolve(filename));
    });
  }
};

module.exports = StorageService;
