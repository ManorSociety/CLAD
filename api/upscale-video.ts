import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 300 };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { videoUrl, projectId, userId } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL required' });
    }

    if (videoUrl.startsWith('data:')) {
      return res.status(400).json({ message: 'Video must be URL. Please regenerate this video.' });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run("runwayml/upscale-v1", {
      input: { video: videoUrl }
    });

    const upscaledUrl = typeof output === 'string' ? output : String(output);

    // Return immediately - background save
    saveToSupabase(upscaledUrl, projectId, userId).catch(() => {});

    return res.status(200).json({ url: upscaledUrl });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Video upscale failed' });
  }
}

async function saveToSupabase(url: string, projectId?: string, userId?: string) {
  try {
    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const fileName = `${userId || 'anon'}/${projectId || 'temp'}/4k-video-${Date.now()}.mp4`;
    await supabase.storage.from('renders').upload(fileName, buffer, { contentType: 'video/mp4' });
  } catch (e) {
    console.log('Background save failed');
  }
}
