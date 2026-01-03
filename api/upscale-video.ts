export const config = {
  maxDuration: 120,
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

    // Using Runway ML upscale API
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "1864a5756e3bfeb4c1db6aaf91dd3ec5e82553f460b23ae8f326d9de4298c537",
        input: {
          video_path: video,
          scale: 4
        }
      })
    });

    const prediction = await response.json();
    
    // Poll for completion
    let result = prediction;
    while (result.status !== 'succeeded' && result.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${result.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        }
      });
      result = await pollResponse.json();
    }

    if (result.status === 'failed') {
      throw new Error('Video upscale failed');
    }

    return res.status(200).json({ url: result.output });
  } catch (error: any) {
    console.error('Video upscale error:', error);
    return res.status(500).json({ message: error.message || 'Video upscale failed' });
  }
}
