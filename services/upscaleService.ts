import { supabase } from './supabaseClient';

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
  let urlToUpscale = videoUrl;

  // If base64, upload to Supabase first to get URL
  if (videoUrl.startsWith('data:video')) {
    const base64Data = videoUrl.split(',')[1];
    const byteChars = atob(base64Data);
    const byteNums = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
    const blob = new Blob([new Uint8Array(byteNums)], { type: 'video/mp4' });
    
    const fileName = `${userId || 'anon'}/${projectId || 'temp'}/video-${Date.now()}.mp4`;
    const { error } = await supabase.storage.from('renders').upload(fileName, blob, { contentType: 'video/mp4' });
    
    if (error) throw new Error('Failed to upload video');
    
    const { data } = supabase.storage.from('renders').getPublicUrl(fileName);
    urlToUpscale = data.publicUrl;
  }

  const response = await fetch('/api/upscale-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl: urlToUpscale, projectId, userId })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upscale video' }));
    throw new Error(error.message);
  }

  const data = await response.json();
  return data.url;
};
