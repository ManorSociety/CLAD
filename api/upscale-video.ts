import Replicate from 'replicate';

export const config = {
  maxDuration: 300, // 5 minutes for video processing
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

    // Use video-realesrgan for video upscaling
    const output = await replicate.run(
      "lucataco/video-realesrgan:c356448e476c0fac51e554149be279cc5eb7fc13dd9a26e78adabf6a8f8f06fc",
      {
        input: {
          video_path: video,
          scale: 4,
          face_enhance: false
        }
      }
    );

    return res.status(200).json({ url: output });
  } catch (error: any) {
    console.error('Video upscale error:', error);
    return res.status(500).json({ message: error.message || 'Video upscale failed' });
  }
}
