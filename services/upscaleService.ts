export const upscaleImage = async (imageUrl: string, projectId?: string, userId?: string): Promise<string> => {
  const response = await fetch('/api/upscale-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, projectId, userId })
  });
  if (!response.ok) throw new Error('Failed to upscale');
  const data = await response.json();
  return data.url;
};

export const upscaleVideo = async (videoUrl: string, projectId?: string, userId?: string): Promise<string> => {
  if (videoUrl.startsWith('data:')) {
    throw new Error('Please regenerate this video first');
  }
  const response = await fetch('/api/upscale-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, projectId, userId })
  });
  if (!response.ok) throw new Error('Failed to upscale video');
  const data = await response.json();
  return data.url;
};
