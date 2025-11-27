import { useCallback } from 'preact/hooks'

// Simple browser uploader hook — wraps the same behaviour as the bash script
// - reads the upload token from Vite env VITE_UPLOAD_TOKEN (optional)
// - posts dataURL/Blob as multipart/form-data with `Authorization: Bearer <token>` and `X-File-Type`

const DEFAULT_API_URL = 'https://flare.dev.kmiecik.pl/api/files'

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } {
  const m = dataUrl.match(/^data:(.+);base64,(.*)$/)
  if (!m) throw new Error('Invalid data URL')
  const mime = m[1]
  const b64 = m[2]
  const binary = atob(b64)
  const len = binary.length
  const arr = new Uint8Array(len)
  for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i)
  const blob = new Blob([arr], { type: mime })
  return { blob, mime }
}

export function useUploader() {
  const token = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_UPLOAD_TOKEN as string | undefined) : undefined
  const apiUrl = typeof import.meta !== 'undefined' ? (import.meta.env?.VITE_API_URL as string | undefined) ?? DEFAULT_API_URL : DEFAULT_API_URL

  const uploadDataUrl = useCallback(async (dataUrl: string, fileName?: string) => {
    if (!token) return null

    fileName = fileName ?? `upload-${((new Date()).toISOString())}`

    const { blob, mime } = dataUrlToBlob(dataUrl)

    const form = new FormData()
    // derive a filename based on mime
    let ext = 'bin'
    try {
      ext = mime.split('/')[1].split('+')[0]
    } catch { }
    const filename = `${fileName}.${ext}`
    form.append('file', blob, filename)

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'X-File-Type': mime,
    }

    const res = await fetch(apiUrl, { method: 'POST', headers, body: form })
    const text = await res.text()
    try {
      return { ok: res.ok, data: text ? JSON.parse(text) : null }
    } catch {
      return { ok: res.ok, data: text }
    }
  }, [token, apiUrl])

  return { uploadDataUrl }
}

export type { }
