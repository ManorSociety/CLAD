import Replicate from 'replicate';

export const config = { maxDuration: 300 };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL is required' });
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      "lucataco/real-esrgan-video:c23768236472f7397be427bed9eb1c3426306999ceac3ba715c94f5227112a1c",
      {
        input: {
          video: videoUrl,
          scale: 4
        }
      }
    );

    const url = typeof output === 'string' ? output : (output as any).url?.() || String(output);
    return res.status(200).json({ url });

  } catch (error: any) {
    console.error('Video upscale error:', error);
    return res.status(500).json({ message: error.message || 'Video upscale failed' });
  }
}
