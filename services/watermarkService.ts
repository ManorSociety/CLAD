/**
 * Add watermark to images for trial/GUEST users
 */

export const addWatermark = async (imageBase64: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(imageBase64);
        return;
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Add watermark
      const fontSize = Math.max(20, img.width / 25);
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      
      const text = 'CLAD TRIAL';
      const textWidth = ctx.measureText(text).width;
      
      // Position: bottom right corner with padding
      const x = img.width - textWidth - 20;
      const y = img.height - 20;
      
      ctx.strokeText(text, x, y);
      ctx.fillText(text, x, y);
      
      // Also add diagonal watermark across image
      ctx.save();
      ctx.translate(img.width / 2, img.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.font = `bold ${fontSize * 2}px Arial`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText('CLAD', 0, 0);
      ctx.fillText('CLAD', 0, 0);
      ctx.restore();
      
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    
    img.onerror = () => resolve(imageBase64);
    img.src = imageBase64;
  });
};

export const shouldWatermark = (tier: string, trialExpiresAt?: string): boolean => {
  if (tier === 'GUEST') return true;
  if (tier === 'STANDARD' || tier === 'PRO' || tier === 'ENTERPRISE' || tier === 'PROJECT_PASS') return false;
  return true;
};

export const isTrialExpired = (trialExpiresAt?: string): boolean => {
  if (!trialExpiresAt) return false;
  return new Date(trialExpiresAt) < new Date();
};
