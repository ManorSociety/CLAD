import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const shareId = url.pathname.split('/share/')[1];

  if (!shareId) {
    return new Response('Share ID required', { status: 400 });
  }

  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('id', shareId)
    .single();

  if (error || !data) {
    return new Response(generateErrorHTML('Share not found or has expired'), {
      status: 404,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Check expiration
  if (data.expires_at && new Date() > new Date(data.expires_at)) {
    return new Response(generateErrorHTML('This share link has expired'), {
      status: 410,
      headers: { 'Content-Type': 'text/html' }
    });
  }

  // Increment view count
  await supabase
    .from('shares')
    .update({ view_count: (data.view_count || 0) + 1 })
    .eq('id', shareId);

  const html = generateShareHTML(data);
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

function generateErrorHTML(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CLAD - Share Not Found</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #000; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; color: #f59e0b; }
    p { color: #888; margin-bottom: 2rem; }
    a { color: #f59e0b; text-decoration: none; padding: 1rem 2rem; border: 1px solid #f59e0b; display: inline-block; }
    a:hover { background: #f59e0b; color: #000; }
  </style>
</head>
<body>
  <div class="container">
    <h1>CLAD</h1>
    <p>${message}</p>
    <a href="https://cladrender.com">Visit CLAD</a>
  </div>
</body>
</html>`;
}

function generateShareHTML(data: any): string {
  const mainImage = data.renderings?.[0] || data.image_url;
  const hasMultiple = data.renderings?.length > 1;
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.project_name} - CLAD Visualization</title>
  <meta property="og:title" content="${data.project_name} - CLAD Visualization">
  <meta property="og:image" content="${mainImage}">
  <meta property="og:description" content="AI-powered architectural visualization created with CLAD">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; }
    .header { padding: 1.5rem 2rem; border-bottom: 1px solid #222; display: flex; justify-content: space-between; align-items: center; }
    .logo { font-size: 1.5rem; font-weight: 300; letter-spacing: 0.3em; color: #fff; text-decoration: none; }
    .cta { background: #f59e0b; color: #000; padding: 0.75rem 1.5rem; text-decoration: none; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; }
    .cta:hover { background: #d97706; }
    .main { max-width: 1400px; margin: 0 auto; padding: 2rem; }
    .title { font-size: 0.7rem; letter-spacing: 0.3em; color: #666; margin-bottom: 0.5rem; text-transform: uppercase; }
    .project-name { font-size: 2rem; font-weight: 300; margin-bottom: 2rem; }
    .gallery { display: grid; gap: 1rem; }
    .main-image { width: 100%; border-radius: 0.5rem; }
    .thumbnails { display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.5rem 0; }
    .thumb { width: 120px; height: 80px; object-fit: cover; border-radius: 0.25rem; cursor: pointer; opacity: 0.6; transition: opacity 0.2s; border: 2px solid transparent; }
    .thumb:hover, .thumb.active { opacity: 1; border-color: #f59e0b; }
    .actions { display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap; }
    .btn { padding: 1rem 2rem; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; border: none; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .btn-primary { background: #fff; color: #000; }
    .btn-primary:hover { background: #f59e0b; }
    .btn-secondary { background: transparent; color: #fff; border: 1px solid #333; }
    .btn-secondary:hover { border-color: #fff; }
    .footer { text-align: center; padding: 3rem; color: #444; font-size: 0.75rem; }
    .footer a { color: #f59e0b; text-decoration: none; }
    .video-container { margin-top: 2rem; }
    .video { width: 100%; border-radius: 0.5rem; }
  </style>
</head>
<body>
  <header class="header">
    <a href="https://cladrender.com" class="logo">CLAD</a>
    <a href="https://cladrender.com" class="cta">CREATE YOUR OWN</a>
  </header>
  
  <main class="main">
    <p class="title">Shared Project</p>
    <h1 class="project-name">${data.project_name}</h1>
    
    <div class="gallery">
      <img id="mainImage" src="${mainImage}" alt="${data.project_name}" class="main-image">
      
      ${hasMultiple ? `
      <div class="thumbnails">
        <img src="${data.image_url}" alt="Original" class="thumb" onclick="setImage('${data.image_url}', this)">
        ${data.renderings.map((r: string, i: number) => `
          <img src="${r}" alt="Render ${i + 1}" class="thumb ${i === 0 ? 'active' : ''}" onclick="setImage('${r}', this)">
        `).join('')}
      </div>
      ` : ''}
    </div>
    
    ${data.videos?.length > 0 ? `
    <div class="video-container">
      <p class="title" style="margin-top: 2rem;">Cinematic Video</p>
      <video controls class="video" poster="${mainImage}">
        <source src="${data.videos[0]}" type="video/mp4">
      </video>
    </div>
    ` : ''}
    
    ${data.allow_download ? `
    <div class="actions">
      <button class="btn btn-primary" onclick="downloadImage()">
        <i class="fa-solid fa-download"></i> Download Image
      </button>
      <button class="btn btn-secondary" onclick="copyLink()">
        <i class="fa-solid fa-link"></i> Copy Link
      </button>
      <button class="btn btn-secondary" onclick="shareEmail()">
        <i class="fa-solid fa-envelope"></i> Share via Email
      </button>
    </div>
    ` : ''}
  </main>
  
  <footer class="footer">
    <p>Created with <a href="https://cladrender.com">CLAD</a> - AI Architectural Visualization</p>
  </footer>
  
  <script>
    let currentImage = '${mainImage}';
    
    function setImage(src, el) {
      currentImage = src;
      document.getElementById('mainImage').src = src;
      document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
    }
    
    function downloadImage() {
      const link = document.createElement('a');
      link.href = currentImage;
      link.download = '${data.project_name.toLowerCase().replace(/\s+/g, '-')}-render.jpg';
      link.click();
    }
    
    function copyLink() {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
    
    function shareEmail() {
      const subject = encodeURIComponent('Check out this home design: ${data.project_name}');
      const body = encodeURIComponent('I wanted to share this architectural visualization with you:\\n\\n' + window.location.href + '\\n\\nCreated with CLAD');
      window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
    }
  </script>
</body>
</html>`;
}
