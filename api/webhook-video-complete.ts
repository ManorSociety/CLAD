import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const config = {
  maxDuration: 30,
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const prediction = req.body;
    console.log('Webhook received:', prediction.id, prediction.status);

    if (prediction.status !== 'succeeded') {
      await supabase
        .from('video_upscale_jobs')
        .update({ status: 'failed', completed_at: new Date().toISOString() })
        .eq('prediction_id', prediction.id);
      
      return res.status(200).json({ received: true });
    }

    // Get job details from Supabase
    const { data: job, error } = await supabase
      .from('video_upscale_jobs')
      .select('*')
      .eq('prediction_id', prediction.id)
      .single();

    if (error || !job) {
      console.error('Job not found:', prediction.id);
      return res.status(200).json({ received: true });
    }

    // Get output URL
    const videoUrl = prediction.output?.url || prediction.output;

    // Update job as completed
    await supabase
      .from('video_upscale_jobs')
      .update({ 
        status: 'completed', 
        video_url: videoUrl,
        completed_at: new Date().toISOString() 
      })
      .eq('prediction_id', prediction.id);

    // Send email
    await resend.emails.send({
      from: 'CLAD <noreply@cladrender.com>',
      to: job.email,
      subject: `Your 4K Video is Ready - ${job.project_name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #000; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #fff; font-size: 24px; font-weight: 300; letter-spacing: 8px; margin: 0;">CLAD</h1>
              <p style="color: #666; font-size: 10px; letter-spacing: 3px; margin-top: 8px;">ARCHITECTURAL VISUALIZATION</p>
            </div>
            
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border: 1px solid #333; border-radius: 16px; padding: 40px; text-align: center;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px;">🎬</span>
              </div>
              
              <h2 style="color: #fff; font-size: 20px; font-weight: 500; margin: 0 0 8px;">Your 4K Video is Ready</h2>
              <p style="color: #888; font-size: 14px; margin: 0 0 32px;">${job.project_name}</p>
              
              <a href="${videoUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; text-decoration: none; padding: 16px 48px; border-radius: 50px; font-weight: 600; font-size: 14px; letter-spacing: 1px;">DOWNLOAD VIDEO</a>
              
              <p style="color: #666; font-size: 12px; margin-top: 32px;">Link expires in 24 hours</p>
            </div>
            
            <div style="text-align: center; margin-top: 40px;">
              <p style="color: #444; font-size: 11px; margin: 0;">
                <a href="https://www.cladrender.com" style="color: #666; text-decoration: none;">www.cladrender.com</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log('Email sent to:', job.email);
    return res.status(200).json({ received: true, emailSent: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return res.status(500).json({ message: error.message });
  }
}
