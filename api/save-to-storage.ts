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
    const { url, projectId, userId, type } = req.body;

    if (!url || url.startsWith('data:')) {
      return res.status(400).json({ message: 'URL required' });
    }

    const response = await fetch(url);
    const buffer = Buffer.from(await response.arrayBuffer());
    const ext = type === 'video' ? 'mp4' : 'png';
    const contentType = type === 'video' ? 'video/mp4' : 'image/png';
    const fileName = `${userId || 'anon'}/${projectId}/permanent-${type}-${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage
      .from('renders')
      .upload(fileName, buffer, { contentType, upsert: true });

    if (error) {
      return res.status(500).json({ message: error.message });
    }

    const { data } = supabase.storage.from('renders').getPublicUrl(fileName);
    return res.status(200).json({ url: data.publicUrl });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
