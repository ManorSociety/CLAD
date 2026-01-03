import Replicate from 'replicate';

export const config = {
  maxDuration: 300, // 5 minutes for video
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { video } = req.body;
    
    if (!video) {
      return res.status(400).json({ message: 'Video URL is required' });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run("runwayml/upscale-v1", {
      input: {
        video: video
      }
    });

    // output is a FileOutput object, get the URL
    const url = typeof output === 'string' ? output : (output as any).url?.() || output;

    return res.status(200).json({ url });
  } catch (error: any) {
    console.error('Video upscale error:', error);
    return res.status(500).json({ message: error.message || 'Video upscale failed' });
  }
}
