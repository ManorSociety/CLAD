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
      return res.status(400).json({ message: 'Video URL is required' });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('Starting video upscale for:', videoUrl);

    // Use runwayml/upscale-v1 for video upscaling
    const output = await replicate.run("runwayml/upscale-v1", {
      input: {
        video: videoUrl
      }
    });

    // Handle different output formats
    let upscaledUrl: string;
    if (typeof output === 'string') {
      upscaledUrl = output;
    } else if (output && typeof output === 'object') {
      upscaledUrl = (output as any).url || String(output);
    } else {
      throw new Error('Unexpected output format');
    }

    console.log('Replicate video returned:', upscaledUrl);

    // Upload to Supabase for permanent storage
    if (projectId) {
      try {
        const videoResponse = await fetch(upscaledUrl);
        const arrayBuffer = await videoResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const fileName = `${userId || 'anon'}/${projectId}/4k-video-${Date.now()}.mp4`;
        
        const { error: uploadError } = await supabase.storage
          .from('renders')
          .upload(fileName, buffer, {
            contentType: 'video/mp4',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase video upload error:', uploadError);
          return res.status(200).json({ url: upscaledUrl, permanent: false });
        }

        const { data: urlData } = supabase.storage.from('renders').getPublicUrl(fileName);
        console.log('Video uploaded to Supabase:', urlData.publicUrl);
        
        return res.status(200).json({ url: urlData.publicUrl, permanent: true });
      } catch (uploadErr) {
        console.error('Video upload failed:', uploadErr);
        return res.status(200).json({ url: upscaledUrl, permanent: false });
      }
    }

    return res.status(200).json({ url: upscaledUrl, permanent: false });

  } catch (error: any) {
    console.error('Video upscale error:', error);
    return res.status(500).json({ message: error.message || 'Video upscale failed' });
  }
}
