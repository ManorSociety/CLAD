// Upscale Service - Replicate for images and video
// Server handles Supabase upload to avoid CORS issues

export const upscaleImage = async (imageUrl: string, projectId?: string, userId?: string): Promise<string> => {
  const apiResponse = await fetch('/api/upscale-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, projectId, userId })
  });

  if (!apiResponse.ok) {
    const error = await apiResponse.json().catch(() => ({ message: 'Failed to upscale image' }));
    throw new Error(error.message || 'Failed to upscale image');
  }

  const data = await apiResponse.json();
  
  if (!data.permanent) {
    console.warn('4K image is temporary URL - may expire in ~1 hour');
  }
  
  return data.url;
};

export const upscaleVideo = async (videoUrl: string, projectId?: string, userId?: string): Promise<string> => {
  const response = await fetch('/api/upscale-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, projectId, userId })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upscale video' }));
    throw new Error(error.message || 'Failed to upscale video');
  }

  const data = await response.json();
  return data.url;
};
