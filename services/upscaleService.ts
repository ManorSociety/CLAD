// Upscale Service - Image only (Real-ESRGAN)

export const upscaleImage = async (imageUrl: string, projectId?: string, userId?: string): Promise<string> => {
  // Convert URL to base64 first
  let base64 = imageUrl;
  if (!imageUrl.startsWith('data:')) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  }

  const response = await fetch('/api/upscale-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, projectId, userId })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upscale');
  }
  
  const data = await response.json();
  return data.url;
};
