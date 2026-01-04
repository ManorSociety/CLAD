export const upscaleImage = async (imageUrl: string, projectId?: string, userId?: string): Promise<string> => {
  const response = await fetch('/api/upscale-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl, projectId, userId })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upscale' }));
    throw new Error(error.message);
  }

  const data = await response.json();
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
    throw new Error(error.message);
  }

  const data = await response.json();
  return data.url;
};
