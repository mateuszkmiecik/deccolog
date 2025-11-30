import { type FingerprintResult } from '@/types'
import { ImageProcessingError } from '@/lib/errors'

export async function getRobustFingerprint(
  img: HTMLImageElement,
  size = 32
): Promise<FingerprintResult> {
  if (!img.complete || img.naturalWidth === 0) {
    throw new ImageProcessingError('Image not loaded or invalid')
  }

  if (size < 8 || size > 128) {
    throw new ImageProcessingError('Invalid fingerprint size. Must be between 8 and 128.')
  }

  try {
    const [dHash, canvasDataUrl] = calculateDHash(img);
    const fingerprint = binaryToHex(dHash);

    return { fingerprint, canvas: canvasDataUrl }
  } catch (error) {
    if (error instanceof ImageProcessingError) throw error
    throw new ImageProcessingError(`Failed to generate fingerprint: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

const HASH_SIZE = 8;

function calculateDHash(img: CanvasImageSource) {
  // 1. Resize and Grayscale the image to HASH_SIZE x (HASH_SIZE + 1) -> 8x9
  const width = HASH_SIZE + 1; // 9
  const height = HASH_SIZE;    // 8


  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new ImageProcessingError('Cannot get canvas context')

  canvas.width = width;
  canvas.height = height;

  // Draw the image scaled down to 9x8 pixels
  ctx.drawImage(img, 0, 0, width, height);

  // Get pixel data from the canvas
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data; // R, G, B, A for 72 pixels (72 * 4 = 288 elements)

  let dHash = '';

  // 2. Iterate through rows (0 to 7)
  for (let y = 0; y < height; y++) {
    // 3. Iterate through columns (0 to 7) for comparison
    for (let x = 0; x < HASH_SIZE; x++) {
      // Index calculation: (y * width + x) * 4 for the R channel
      const indexLeft = (y * width + x) * 4;
      const indexRight = (y * width + (x + 1)) * 4;

      // Get average brightness (simple grayscale approximation: R+G+B / 3)
      // In reality, only one channel (like R) is often sufficient 
      // for speed and consistency, as the image is scaled small.

      // We use the Red channel (index + 0) for simplicity after drawImage, 
      // assuming the browser performs a good internal downsampling.
      const brightnessLeft = data[indexLeft];
      const brightnessRight = data[indexRight];

      // 4. Compare difference
      // If left pixel is brighter or equal to the right pixel, set bit to 1, else 0.
      if (brightnessLeft >= brightnessRight) {
        dHash += '1';
      } else {
        dHash += '0';
      }
    }
  }

  return [dHash, canvas.toDataURL()]; // 64-character binary string
}

// Helper function to convert 64-bit binary string to 16-character hex string
function binaryToHex(binary: string) {
  let hex = '';
  for (let i = 0; i < binary.length; i += 4) {
    const chunk = binary.substring(i, i + 4);
    // Convert the 4-bit chunk to a hex digit
    hex += parseInt(chunk, 2).toString(16);
  }
  return hex;
}