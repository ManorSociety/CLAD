import { GoogleAuth } from 'google-auth-library';

export const config = {
  maxDuration: 300,
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64, prompt, aspectRatio = '16:9' } = req.body;
    
    const b64 = process.env.GCP_SERVICE_ACCOUNT_B64;
    if (!b64) {
      return res.status(500).json({ error: 'Missing credentials' });
    }
    
    const jsonStr = Buffer.from(b64, 'base64').toString('utf-8');
    const credentials = JSON.parse(jsonStr);
    
    const auth = new GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    const projectId = credentials.project_id;
    const location = 'us-central1';
    const model = 'veo-3.1-fast-generate-001';
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;
    
    const generateResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{
          prompt: `Cinematic architectural drone orbit around this luxury home. Smooth, professional tracking shot. Maintain exact structure - no modifications. High-end real estate film quality. Golden hour lighting. ${prompt}`,
          image: {
            bytesBase64Encoded: imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64,
            mimeType: 'image/jpeg',
          },
        }],
        parameters: {
          aspectRatio: aspectRatio,
          sampleCount: 1,
          durationSeconds: 6,
        },
      }),
    });

    const genText = await generateResponse.text();
    if (!generateResponse.ok) {
      return res.status(500).json({ error: 'Generate failed', detail: genText.substring(0, 300) });
    }

    const generateData = JSON.parse(genText);
    const operationName = generateData.name;
    
    // Poll for completion using fetchPredictOperation
    let attempts = 0;
    let done = false;
    let result: any = null;
    
    while (!done && attempts < 30) {
      attempts++;
      await new Promise(r => setTimeout(r, 10000));
      
      const pollUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`;
      const pollResponse = await fetch(pollUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operationName: operationName
        })
      });
      
      const pollText = await pollResponse.text();
      if (!pollResponse.ok) {
        return res.status(500).json({ error: 'Poll failed', detail: pollText.substring(0, 300) });
      }
      
      result = JSON.parse(pollText);
      done = result.done === true;
    }

    if (!result || result.error) {
      return res.status(500).json({ error: 'Video error', detail: JSON.stringify(result?.error || 'timeout') });
    }

    // Get video from response
    const videos = result.response?.videos;
    if (!videos || videos.length === 0) {
      return res.status(500).json({ error: 'No video in response', response: JSON.stringify(result).substring(0, 500) });
    }

    // If video is in GCS, we need to fetch it
    const videoUri = videos[0].gcsUri;
    if (videoUri) {
      // Return the GCS URI - client will need to handle this
      return res.status(200).json({ videoUri: videoUri });
    }

    // If video bytes are returned directly
    const videoData = videos[0].bytesBase64Encoded;
    if (videoData) {
      return res.status(200).json({ video: `data:video/mp4;base64,${videoData}` });
    }

    return res.status(500).json({ error: 'No video data', videos: videos });
    
  } catch (error: any) {
    return res.status(500).json({ error: 'Exception', message: error.message });
  }
}
