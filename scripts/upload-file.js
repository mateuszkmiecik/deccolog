#!/usr/bin/env node
/*
Node.js script which mimics the bash uploader you provided.

Features:
- Detects mimetype (tries to inspect file bytes via `file-type`, falls back to extension lookup)
- Uploads using a multipart/form-data POST and sends the same headers as your bash version

Install dependencies before using:
  npm install axios form-data mime-types file-type

Usage:
  UPLOAD_TOKEN="your-token" node scripts/upload-file.js path/to/file.jpg

Notes:
- If `file-type` can't be imported (older environments), this script will still work using extension-based detection via `mime-types`.
*/

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const mime = require('mime-types');

async function detectMime(buffer, filePath) {
  // try to dynamically load the `file-type` package if available and supported
  try {
    const fileType = await import('file-type');
    if (fileType && fileType.fileTypeFromBuffer) {
      const info = await fileType.fileTypeFromBuffer(buffer);
      if (info && info.mime) return info.mime;
    }
  } catch (err) {
    // file-type may be ESM-only in some environments; silently continue to fallback
  }

  // fallback to extension-based lookup
  const byExt = mime.lookup(filePath);
  return byExt || 'application/octet-stream';
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: UPLOAD_TOKEN="<token>" node scripts/upload-file.js <path-to-file>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error('Error: file not found:', filePath);
    process.exit(1);
  }

  const token = process.env.UPLOAD_TOKEN;
  const apiUrl = process.env.API_URL || 'https://flare.dev.kmiecik.pl/api/files';

  if (!token) {
    console.error('Error: set UPLOAD_TOKEN environment variable (e.g. export UPLOAD_TOKEN="..." )');
    process.exit(1);
  }

  console.log('Reading file to detect mimetype...');
  const buffer = await fs.promises.readFile(filePath);
  const mimetype = await detectMime(buffer, filePath);

  console.log('Detected mimetype:', mimetype);

  // Prepare form-data
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), {
    filename: path.basename(filePath),
    contentType: mimetype,
  });

  // Build headers with Authorization and X-File-Type + form headers
  const headers = Object.assign(
    {
      Authorization: `Bearer ${token}`,
      'X-File-Type': mimetype,
    },
    form.getHeaders()
  );

  console.log('Uploading file...');

  try {
    const resp = await axios.post(apiUrl, form, { headers });
    // Try to print a small readable response; axios will parse JSON if returned
    if (resp && resp.data) {
      console.log('Upload successful. Server response:');
      console.log(typeof resp.data === 'object' ? JSON.stringify(resp.data, null, 2) : String(resp.data));
    } else {
      console.log('Upload completed (empty response). HTTP status:', resp.status);
    }
  } catch (err) {
    if (err.response) {
      console.error('Upload failed. Server returned status', err.response.status);
      console.error(err.response.data || err.response.statusText);
    } else {
      console.error('Upload failed:', err.message);
    }
    process.exit(2);
  }
}

main();
