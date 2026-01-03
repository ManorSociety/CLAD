import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

export const config = { 
  maxDuration: 300,
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
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
      return res.status(400).json({ message: 'Video URL is required' });
    }

    let sourceUrl = videoUrl;

    // If video is base64, upload to Supabase first
    if (videoUrl.startsWith('data:video')) {
      console.log('Converting base64 video to URL...');
      const base64Data = videoUrl.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const tempFileName = `${userId || 'anon'}/${projectId}/temp-video-${Date.now()}.mp4`;
      
      const { error: tempUploadError } = await supabase.storage
        .from('renders')
        .upload(tempFileName, buffer, { contentType: 'video/mp4', upsert: true });
      
      if (tempUploadError) {
        console.error('Failed to upload temp video:', tempUploadError);
        return res.status(500).json({ message: 'Failed to process video' });
      }
      
      const { data: tempUrlData } = supabase.storage.from('renders').getPublicUrl(tempFileName);
      sourceUrl = tempUrlData.publicUrl;
      console.log('Temp video URL:', sourceUrl);
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('Starting video upscale for:', sourceUrl);

    const output = await replicate.run("runwayml/upscale-v1", {
      input: {
        video: sourceUrl
      }
    });

    console.log('Replicate raw output:', output, typeof output);

    // Handle FileOutput from Replicate SDK
    let upscaledUrl: string;
    if (typeof output === 'string') {
      upscaledUrl = output;
    } else if (output && typeof (output as any).url === 'function') {
      upscaledUrl = (output as any).url();
    } else if (output && (output as any).url) {
      upscaledUrl = (output as any).url;
    } else if (output) {
      upscaledUrl = String(output);
      if (upscaledUrl === '[object Object]') {
        throw new Error('Could not extract URL from Replicate output');
      }
    } else {
      throw new Error('No output from Replicate');
    }

    console.log('Extracted video URL:', upscaledUrl);

    // Upload 4K video to Supabase for permanent storage
    if (projectId && upscaledUrl) {
      try {
        console.log('Fetching 4K video from Replicate...');
        const videoResponse = await fetch(upscaledUrl);
        
        if (!videoResponse.ok) {
          throw new Error(`Failed to fetch video: ${videoResponse.status}`);
        }
        
        const arrayBuffer = await videoResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log('4K Video size:', buffer.length, 'bytes');
        
        const fileName = `${userId || 'anon'}/${projectId}/4k-video-${Date.now()}.mp4`;
        
        const { error: uploadError } = await supabase.storage
          .from('renders')
          .upload(fileName, buffer, {
            contentType: 'video/mp4',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          return res.status(200).json({ url: upscaledUrl, permanent: false });
        }

        const { data: urlData } = supabase.storage.from('renders').getPublicUrl(fileName);
        console.log('Permanent 4K URL:', urlData.publicUrl);
        
        return res.status(200).json({ url: urlData.publicUrl, permanent: true });
      } catch (uploadErr: any) {
        console.error('Upload process failed:', uploadErr.message);
        return res.status(200).json({ url: upscaledUrl, permanent: false });
      }
    }

    return res.status(200).json({ url: upscaledUrl, permanent: false });

  } catch (error: any) {
    console.error('Video upscale error:', error);
    return res.status(500).json({ message: error.message || 'Video upscale failed' });
  }
}
