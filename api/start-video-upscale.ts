import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 30,
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { video, email, projectName, userId } = req.body;
    
    if (!video || !email || !projectName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Start Replicate job with webhook
    const webhookUrl = `https://www.cladrender.com/api/webhook-video-complete`;
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "runwayml/upscale-v1",
        input: { video },
        webhook: webhookUrl,
        webhook_events_filter: ["completed"]
      })
    });

    const prediction = await response.json();
    
    if (!prediction.id) {
      console.error('Replicate error:', prediction);
      throw new Error(prediction.detail || 'Failed to start upscale job');
    }

    // Save job to Supabase
    const { error } = await supabase.from('video_upscale_jobs').insert({
      prediction_id: prediction.id,
      email,
      project_name: projectName,
      user_id: userId || null,
      status: 'processing'
    });

    if (error) {
      console.error('Supabase error:', error);
    }

    return res.status(200).json({ 
      success: true, 
      jobId: prediction.id,
      message: 'Video upscale started. Check your email in 3-5 minutes.'
    });
  } catch (error: any) {
    console.error('Start job error:', error);
    return res.status(500).json({ message: error.message || 'Failed to start job' });
  }
}
