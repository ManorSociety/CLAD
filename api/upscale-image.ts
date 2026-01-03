import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 120 };

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { imageUrl, projectId, userId } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log('Starting upscale for:', imageUrl);

    // Use the latest Real-ESRGAN model (no version hash - uses latest)
    const output = await replicate.run(
      "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
      {
        input: {
          image: imageUrl,
          scale: 4,
          face_enhance: false
        }
      }
    );

    const upscaledUrl = output as string;
    console.log('Replicate returned:', upscaledUrl);

    // Always upload to Supabase for permanent storage
    if (projectId) {
      try {
        const imageResponse = await fetch(upscaledUrl);
        const arrayBuffer = await imageResponse.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const fileName = `${userId || 'anon'}/${projectId}/4k-${Date.now()}.png`;
        
        const { error: uploadError } = await supabase.storage
          .from('renders')
          .upload(fileName, buffer, {
            contentType: 'image/png',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          return res.status(200).json({ url: upscaledUrl, permanent: false });
        }

        const { data: urlData } = supabase.storage.from('renders').getPublicUrl(fileName);
        console.log('Uploaded to Supabase:', urlData.publicUrl);
        
        return res.status(200).json({ url: urlData.publicUrl, permanent: true });
      } catch (uploadErr) {
        console.error('Upload failed:', uploadErr);
        return res.status(200).json({ url: upscaledUrl, permanent: false });
      }
    }

    return res.status(200).json({ url: upscaledUrl, permanent: false });

  } catch (error: any) {
    console.error('Upscale error:', error);
    return res.status(500).json({ message: error.message || 'Upscale failed' });
  }
}
