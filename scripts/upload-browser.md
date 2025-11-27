# Browser upload example

This is a small browser-side snippet that mimics the behavior of the Bash script you provided: it sends the file as multipart/form-data and includes `Authorization` and `X-File-Type` headers.

HTML + JavaScript example:

```html
<!doctype html>
<meta charset="utf-8">
<title>Upload file demo</title>
<input id="file" type="file" />
<button id="upload">Upload</button>
<pre id="out"></pre>

<script>
const API_URL = 'https://flare.dev.kmiecik.pl/api/files';

document.getElementById('upload').addEventListener('click', async () => {
  const input = document.getElementById('file');
  if (!input.files || !input.files[0]) return alert('Pick a file first');

  const file = input.files[0];
  const token = prompt('Paste UPLOAD_TOKEN (or set it in code)');
  if (!token) return alert('Need token');

  const form = new FormData();
  // append the file; browser will set correct Content-Type for the multipart boundary
  form.append('file', file, file.name);

  const mime = file.type || 'application/octet-stream';

  try {
    const resp = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-File-Type': mime
      },
      body: form
    });

    const text = await resp.text();
    document.getElementById('out').textContent = `Status ${resp.status}\n` + text;
  } catch (e) {
    document.getElementById('out').textContent = `Upload failed: ${e.message}`;
  }
});
< /script>
```

Notes:
- Browsers usually know file.type from the file metadata; if file.type is empty you may need additional client-side detection.
- The server should accept the same Authorization and custom header as in your bash script.
