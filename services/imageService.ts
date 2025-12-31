
// Enhanced Image Processing & Optimization Service
export interface ProcessedAsset {
  coverImage: string;
  allPages: string[];
}

/**
 * Optimizes an image by resizing and compressing to prevent browser hangs.
 * Targets ~1440p for high-quality display with a sustainable storage footprint.
 */
export const optimizeImage = (base64: string, quality: number = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject("Optimization timed out"), 15000);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      clearTimeout(timeout);
      const MAX_DIMENSION = 2560; 
      const TARGET_DIMENSION = 1440; // Reduced from 1920 to 1440 for better storage stability
      
      let width = img.width;
      let height = img.height;

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width *= ratio;
        height *= ratio;
      }

      if (width > TARGET_DIMENSION || height > TARGET_DIMENSION) {
        const ratio = Math.min(TARGET_DIMENSION / width, TARGET_DIMENSION / height);
        width *= ratio;
        height *= ratio;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject("Canvas failure");
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'medium';
        ctx.drawImage(img, 0, 0, width, height);
        
        const result = canvas.toDataURL('image/jpeg', quality);
        
        // Explicitly clear canvas to free memory immediately
        canvas.width = 0;
        canvas.height = 0;
        
        if (result.length < 100) return reject("Optimization failed");
        resolve(result);
      } catch (e) {
        reject(`Canvas error: ${e}`);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      reject("Image load error");
    };
    img.src = base64;
  });
};

const getHeicConverter = (): Promise<any> => {
  return new Promise((resolve) => {
    // @ts-ignore
    if (window.heic2any) return resolve(window.heic2any);
    let checkCount = 0;
    const interval = setInterval(() => {
      checkCount++;
      // @ts-ignore
      if (window.heic2any || checkCount > 30) {
        clearInterval(interval);
        // @ts-ignore
        resolve(window.heic2any || null);
      }
    }, 100);
  });
};

export const processImageUpload = async (file: File): Promise<ProcessedAsset> => {
  const name = file.name.toLowerCase();
  try {
    let rawBase64: string = '';
    if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
      const fileUrl = URL.createObjectURL(file);
      // @ts-ignore
      const pdf = await pdfjsLib.getDocument(fileUrl).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise;
      rawBase64 = canvas.toDataURL('image/jpeg', 0.6);
      URL.revokeObjectURL(fileUrl);
    } else {
      rawBase64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    const optimized = await optimizeImage(rawBase64, 0.6);
    return { coverImage: optimized, allPages: [optimized] };
  } catch (err) {
    throw err;
  }
};
