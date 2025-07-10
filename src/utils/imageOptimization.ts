import { UI_CONSTANTS, OPTIMIZABLE_IMAGE_TYPES } from '../constants';
import type { FileData, OptimizedFileData } from '../types';

export class ImageOptimizer {
  static async optimizeImage(
    dataURL: string,
    mimeType: string,
    maxWidth = UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_WIDTH,
    maxHeight = UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_HEIGHT,
    quality = UI_CONSTANTS.IMAGE_OPTIMIZATION.QUALITY
  ): Promise<string> {
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
        
        if (fileData.mimeType && OPTIMIZABLE_IMAGE_TYPES.includes(fileData.mimeType as 'image/jpeg' | 'image/png' | 'image/webp')) {
          // Only optimize if it's an image
          optimizedDataURL = await this.optimizeImage(
            fileData.dataURL,
            fileData.mimeType,
            UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_WIDTH,
            UI_CONSTANTS.IMAGE_OPTIMIZATION.MAX_HEIGHT,
            UI_CONSTANTS.IMAGE_OPTIMIZATION.QUALITY
          );
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