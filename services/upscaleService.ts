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
  // If base64, upload to temp storage first
  let urlToUpscale = videoUrl;
  
  if (videoUrl.startsWith('data:video')) {
    // Upload base64 to get URL
    const uploadRes = await fetch('/api/upload-video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoBase64: videoUrl, projectId, userId })
    });
    if (!uploadRes.ok) throw new Error('Failed to upload video');
    const uploadData = await uploadRes.json();
    urlToUpscale = uploadData.url;
  }

  // Upscale - returns fast with Replicate URL
  const response = await fetch('/api/upscale-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl: urlToUpscale, projectId, userId })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upscale' }));
    throw new Error(error.message);
  }

  const data = await response.json();
  
  // Background: save to permanent storage (non-blocking)
  if (data.url && !data.permanent) {
    saveToStorageBackground(data.url, projectId, userId, 'video');
  }

  return data.url;
};

// Non-blocking background save
const saveToStorageBackground = (url: string, projectId?: string, userId?: string, type: string = 'image') => {
  fetch('/api/save-to-storage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, projectId, userId, type })
  }).then(res => res.json())
    .then(data => console.log('Saved to permanent storage:', data.url))
    .catch(err => console.error('Background save failed:', err));
};
