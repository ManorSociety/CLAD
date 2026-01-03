import Replicate from 'replicate';

export const config = {
  maxDuration: 120, // Increased to 120 seconds
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { image } = req.body;
    
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

    // Fetch the image from Replicate and convert to base64
    const imageUrl = output as string;
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = response.headers.get('content-type') || 'image/png';

    return res.status(200).json({ 
      base64: `data:${mimeType};base64,${base64}`
    });
  } catch (error: any) {
    console.error('Upscale error:', error);
    return res.status(500).json({ message: error.message || 'Upscale failed' });
  }
}
