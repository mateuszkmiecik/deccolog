# Upload helpers (scripts)

This small folder contains example utilities for uploading files to the same endpoint used by your original Bash script.

Node script
-----------

- File: `scripts/upload-file.js`
- Installs:

  ```bash
  npm install axios form-data mime-types file-type
  # or with yarn
  # yarn add axios form-data mime-types file-type
  ```

- Usage:

  ```bash
  UPLOAD_TOKEN="cad5c027-79a9-4c35-99f0-110c66592a27" node scripts/upload-file.js path/to/file.png
  ```

- The script tries to detect mimetype using `file-type` (inspects bytes) and falls back to `mime-types` if needed. It sends `Authorization: Bearer <token>` and `X-File-Type: <mimetype>` headers.

Browser example
---------------

- File: `scripts/upload-browser.md` contains a small HTML + JavaScript snippet using `fetch` and `FormData` that sets the same headers.

Why two examples?
-----------------
Sometimes you will want a quick Node CLI for local scripts or CI, while other times a browser-based uploader (drag & drop or file input) is more convenient for end users.
