import { createClient } from '@supabase/supabase-js';

export const config = { 
  maxDuration: 60,
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
    const { videoBase64, projectId, userId } = req.body;
    
    if (!videoBase64) {
      return res.status(400).json({ message: 'Video data required' });
    }

    const base64Data = videoBase64.includes(',') ? videoBase64.split(',')[1] : videoBase64;
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `${userId || 'anon'}/${projectId}/video-${Date.now()}.mp4`;
    
    const { error } = await supabase.storage
      .from('renders')
      .upload(fileName, buffer, { contentType: 'video/mp4', upsert: true });
    
    if (error) throw error;
    
    const { data } = supabase.storage.from('renders').getPublicUrl(fileName);
    return res.status(200).json({ url: data.publicUrl });
  } catch (error: any) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: error.message });
  }
}
