// Upscale Service - Replicate for images, Runway for video

export const upscaleImage = async (imageBase64: string): Promise<string> => {
  const response = await fetch('/api/upscale-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageBase64 })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upscale image');
  }
  
  const data = await response.json();
  return data.url;
};

export const upscaleVideo = async (videoUrl: string): Promise<string> => {
  const response = await fetch('/api/upscale-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ video: videoUrl })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upscale video');
  }
  
  const data = await response.json();
  return data.url;
};
