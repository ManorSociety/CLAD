import Replicate from 'replicate';
import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 120,
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
    const { image, projectId, userId } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      "nightmareai/real-esrgan:f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
      {
        input: {
          image: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
          scale: 4,
          face_enhance: false
        }
      }
    );

    const imageUrl = output as string;
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${userId || 'anon'}/${projectId || 'temp'}/4k-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('renders')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      const base64 = buffer.toString('base64');
      return res.status(200).json({ url: `data:image/png;base64,${base64}` });
    }

    const { data } = supabase.storage.from('renders').getPublicUrl(fileName);
    return res.status(200).json({ url: data.publicUrl });

  } catch (error: any) {
    console.error('Upscale error:', error);
    return res.status(500).json({ message: error.message || 'Upscale failed' });
  }
}
