// Upscale Service - Replicate for images and video

export const upscaleImage = async (imageUrl: string): Promise<string> => {
  // Convert image URL to base64 first
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

  const apiResponse = await fetch('/api/upscale-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64 })
  });
  
  if (!apiResponse.ok) {
    const error = await apiResponse.json();
    throw new Error(error.message || 'Failed to upscale image');
  }
  
  const data = await apiResponse.json();
  return data.base64; // Return base64 data URL directly
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
