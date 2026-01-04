import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

export const config = { 
  maxDuration: 300,
  api: { bodyParser: { sizeLimit: '100mb' } }
};

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

    let sourceUrl = videoUrl;

    // If base64, upload to Supabase first to get URL
    if (videoUrl.startsWith('data:video')) {
      const base64Data = videoUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const tempFileName = `${userId || 'anon'}/${projectId || 'temp'}/temp-video-${Date.now()}.mp4`;
      
      const { error } = await supabase.storage
        .from('renders')
        .upload(tempFileName, buffer, { contentType: 'video/mp4', upsert: true });
      
      if (error) {
        console.error('Failed to upload temp video:', error);
        return res.status(500).json({ message: 'Failed to process video' });
      }
      
      const { data } = supabase.storage.from('renders').getPublicUrl(tempFileName);
      sourceUrl = data.publicUrl;
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run("runwayml/upscale-v1", {
      input: { video: sourceUrl }
    });

    const upscaledUrl = typeof output === 'string' ? output : String(output);

    // Save 4K to Supabase
    try {
      const response = await fetch(upscaledUrl);
      const buffer = Buffer.from(await response.arrayBuffer());
      const fileName = `${userId || 'anon'}/${projectId || 'temp'}/4k-video-${Date.now()}.mp4`;
      
      const { error } = await supabase.storage
        .from('renders')
        .upload(fileName, buffer, { contentType: 'video/mp4', upsert: true });

      if (!error) {
        const { data } = supabase.storage.from('renders').getPublicUrl(fileName);
        return res.status(200).json({ url: data.publicUrl, permanent: true });
      }
    } catch (e) {
      console.log('Supabase save failed, returning Replicate URL');
    }

    return res.status(200).json({ url: upscaledUrl, permanent: false });
  } catch (error: any) {
    console.error('Video upscale error:', error);
    return res.status(500).json({ message: error.message || 'Video upscale failed' });
  }
}
