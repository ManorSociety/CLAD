import Replicate from 'replicate';

export const config = { maxDuration: 300 };

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { videoUrl } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ message: 'Video URL required' });
    }

    // If base64, we need to upload first - but that's slow
    // For now just reject and tell client to upload first
    if (videoUrl.startsWith('data:')) {
      return res.status(400).json({ message: 'Please wait - uploading video first' });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const output = await replicate.run("runwayml/upscale-v1", {
      input: { video: videoUrl }
    });

    const upscaledUrl = typeof output === 'string' ? output : String(output);

    // Return immediately - user can download now
    // Background upload happens separately
    return res.status(200).json({ url: upscaledUrl, permanent: false });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
}
