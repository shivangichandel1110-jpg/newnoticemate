/**
 * Client-Side Image Optimizer
 * Resizes large photos/scans to a crisp, readable resolution (max 1600px)
 * to speed up upload, network transport, and Gemini multimodal processing.
 */

export interface OptimizedImageResult {
  base64Data: string;
  mimeType: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
}

export async function optimizeNoticeImage(
  file: File,
  maxDimension: number = 1600,
  quality: number = 0.85
): Promise<OptimizedImageResult> {
  // If file is already small SVG or small PNG/JPEG (< 400KB), read directly
  if (file.size < 400 * 1024 && !file.type.includes('heic')) {
    const base64 = await readFileAsDataUrl(file);
    return {
      base64Data: base64,
      mimeType: file.type,
      originalSize: file.size,
      optimizedSize: file.size,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to direct read
        readFileAsDataUrl(file).then((b64) =>
          resolve({
            base64Data: b64,
            mimeType: file.type,
            originalSize: file.size,
            optimizedSize: file.size,
            width,
            height,
          })
        );
        return;
      }

      // Smooth downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Export as JPEG (universal, fast, highly compressed)
      const mimeType = 'image/jpeg';
      const base64Data = canvas.toDataURL(mimeType, quality);
      const optimizedSize = Math.round((base64Data.length * 3) / 4);

      resolve({
        base64Data,
        mimeType,
        originalSize: file.size,
        optimizedSize,
        width,
        height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // Fallback: read directly
      readFileAsDataUrl(file)
        .then((b64) =>
          resolve({
            base64Data: b64,
            mimeType: file.type,
            originalSize: file.size,
            optimizedSize: file.size,
            width: 0,
            height: 0,
          })
        )
        .catch(reject);
    };

    img.src = url;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
