import { UI_CONSTANTS, OPTIMIZABLE_IMAGE_TYPES } from '../constants';
import type { FileData, OptimizedFileData } from '../types';

export class ImageOptimizer {
  static async fileToWebPBlob(file: File, maxDim = UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_WIDTH, quality = UI_CONSTANTS.IMAGE_OPTIMIZATION.QUALITY): Promise<Blob> {
    // Handle SVG files differently - keep as SVG to preserve vector quality
    if (file.type === 'image/svg+xml') {
      const svgText = await file.text();
      return new Blob([svgText], { type: 'image/svg+xml' });
    }

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const imgEl = new Image();
      imgEl.onload = () => resolve(imgEl);
      imgEl.onerror = reject;
      imgEl.src = url;
    });
    const deviceScale = Math.max(1, Math.round((window.devicePixelRatio || 1) * 1.5)); // 1.5x multiplier for extra sharpness
    const targetMax = maxDim * deviceScale; // Higher scale for sharper images
    const scale = Math.min(1, targetMax / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    // higher quality scaling with better interpolation
    ctx.imageSmoothingEnabled = true;
    // Some TS DOM lib versions may not include imageSmoothingQuality
    (ctx as CanvasRenderingContext2D & { imageSmoothingQuality?: 'low' | 'medium' | 'high' }).imageSmoothingQuality = 'high';
    
    // Additional quality settings for sharper rendering
    ctx.textBaseline = 'top';
    ctx.drawImage(img, 0, 0, width, height);
    const mime = file.type === 'image/png' ? 'image/png' : 'image/webp';
    const dataUrl = canvas.toDataURL(mime, quality);
    const res = await fetch(dataUrl);
    return await res.blob();
  }
  static async optimizeImage(
    dataURL: string,
    mimeType: string,
    maxWidth = UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_WIDTH,
    maxHeight = UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_HEIGHT,
    quality = UI_CONSTANTS.IMAGE_OPTIMIZATION.QUALITY
  ): Promise<string> {
    // Skip optimization for SVG files
    if (mimeType === 'image/svg+xml') {
      return dataURL;
    }

    return new Promise((resolve) => {
      const img = new window.Image();
      
      img.onload = function () {
        const { width, height } = img;
        let newWidth = width;
        let newHeight = height;

        // Resize if necessary
        if (width > maxWidth || height > maxHeight) {
          const aspect = width / height;
          if (width > height) {
            newWidth = maxWidth;
            newHeight = Math.round(maxWidth / aspect);
          } else {
            newHeight = maxHeight;
            newWidth = Math.round(maxHeight * aspect);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Only compress if image is jpeg or webp, otherwise keep original
          let outMime = mimeType;
          if (mimeType === 'image/jpeg' || mimeType === 'image/webp') {
            outMime = mimeType;
          } else if (mimeType === 'image/png') {
            outMime = 'image/png';
          }
          
          const optimizedDataURL = canvas.toDataURL(outMime, quality);
          resolve(optimizedDataURL);
        } else {
          // fallback to original
          resolve(dataURL);
        }
      };
      
      img.onerror = function () {
        resolve(dataURL);
      };
      
      img.src = dataURL;
    });
  }

  static async optimizeFiles(files: Record<string, unknown>): Promise<Record<string, OptimizedFileData>> {
    const filesWithBase64: Record<string, OptimizedFileData> = {};

    for (const [fileId, file] of Object.entries(files)) {
      if (file && typeof file === 'object' && 'dataURL' in file && typeof file.dataURL === 'string') {
        const fileData = file as FileData;
        let optimizedDataURL = fileData.dataURL;
        
        if (fileData.mimeType && OPTIMIZABLE_IMAGE_TYPES.includes(fileData.mimeType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/svg+xml')) {
          // Only optimize if it's an image, but skip SVG optimization
          if (fileData.mimeType === 'image/svg+xml') {
            // Keep SVG as-is to preserve vector quality
            optimizedDataURL = fileData.dataURL;
          } else {
            // Optimize raster images
            optimizedDataURL = await this.optimizeImage(
              fileData.dataURL,
              fileData.mimeType,
              UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_WIDTH,
              UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_HEIGHT,
              UI_CONSTANTS.IMAGE_OPTIMIZATION.QUALITY
            );
          }
        }
        
        filesWithBase64[fileId] = {
          id: fileData.id || fileId,
          dataURL: optimizedDataURL,
          mimeType: fileData.mimeType || 'application/octet-stream',
          name: fileData.name || `file-${fileId}`,
          size: fileData.size || 0
        };
      }
    }
    
    return filesWithBase64;
  }
} 