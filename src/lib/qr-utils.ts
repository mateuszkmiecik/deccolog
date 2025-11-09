import QRCode from 'qrcode'
import QrScanner from 'qr-scanner'

export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function scanQRCode(file: File): Promise<string> {
  try {
    const result = await QrScanner.scanImage(file)
    return result
  } catch (error) {
    throw new Error(`Failed to scan QR code: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function captureQRCodeFromVideo(videoElement: HTMLVideoElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const qrScanner = new QrScanner(
      videoElement,
      (result: string) => {
        qrScanner.stop()
        resolve(result)
      }
    )
    
    qrScanner.start().catch(reject)
  })
}