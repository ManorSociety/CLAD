// Upscale Service - Replicate for images and video
// URL-based to avoid Vercel body size limits

import { supabase } from './supabase';

export const upscaleImage = async (imageUrl: string, projectId?: string): Promise<string> => {
  const apiResponse = await fetch('/api/upscale-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl })
  });

  if (!apiResponse.ok) {
    const error = await apiResponse.json().catch(() => ({ message: 'Failed to upscale image' }));
    throw new Error(error.message || 'Failed to upscale image');
  }

  const data = await apiResponse.json();
  const upscaledUrl = data.url;

  if (projectId && supabase) {
    try {
      return await uploadToSupabase(upscaledUrl, projectId, 'image');
    } catch (e) {
      console.warn('Supabase upload failed, using temp URL:', e);
      return upscaledUrl;
    }
  }
  return upscaledUrl;
};

export const upscaleVideo = async (videoUrl: string, projectId?: string): Promise<string> => {
  const response = await fetch('/api/upscale-video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to upscale video' }));
    throw new Error(error.message || 'Failed to upscale video');
  }

  const data = await response.json();
  const upscaledUrl = data.url;

  if (projectId && supabase) {
    try {
      return await uploadToSupabase(upscaledUrl, projectId, 'video');
    } catch (e) {
      console.warn('Supabase upload failed, using temp URL:', e);
      return upscaledUrl;
    }
  }
  return upscaledUrl;
};

async function uploadToSupabase(fileUrl: string, projectId: string, type: 'image' | 'video'): Promise<string> {
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error('Failed to fetch upscaled file');

  const blob = await response.blob();
  const ext = type === 'video' ? 'mp4' : 'png';
  const filename = `${projectId}/upscaled-${type}-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from('renders')
    .upload(filename, blob, {
      contentType: type === 'video' ? 'video/mp4' : 'image/png',
      upsert: true
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from('renders').getPublicUrl(filename);
  return urlData.publicUrl;
}
