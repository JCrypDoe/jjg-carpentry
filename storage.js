const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const JOB_UPLOAD_DIR = path.resolve(process.env.JOB_UPLOAD_DIR || path.join(__dirname, 'public/images/jobs'));
const THUMB_DIR = path.join(JOB_UPLOAD_DIR, 'thumbs');

[DATA_DIR, JOB_UPLOAD_DIR, THUMB_DIR].forEach(directory => {
  fs.mkdirSync(directory, { recursive: true });
});

module.exports = { DATA_DIR, JOB_UPLOAD_DIR, THUMB_DIR };