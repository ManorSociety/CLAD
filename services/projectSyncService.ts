import { supabase } from './supabaseClient';
import { Project } from '../types';

const urlToBase64 = async (url: string): Promise<string> => {
  try {
    if (url.startsWith('data:')) return url;
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert URL to base64:', error);
    return url;
  }
};

export const uploadImage = async (base64Image: string, userId: string, projectId: string, type: 'original' | 'render' | 'video', index?: number): Promise<string> => {
  const base64Data = base64Image.split(',')[1] || base64Image;
  const mimeMatch = base64Image.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const ext = mimeType.includes('png') ? 'png' : mimeType.includes('mp4') ? 'mp4' : 'jpg';
  const byteChars = atob(base64Data);
  const byteNums = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
  const blob = new Blob([new Uint8Array(byteNums)], { type: mimeType });
  const filename = userId + '/' + projectId + '/' + type + (index !== undefined ? '-' + index : '') + '-' + Date.now() + '.' + ext;
  const { error } = await supabase.storage.from('renders').upload(filename, blob, { contentType: mimeType, upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('renders').getPublicUrl(filename);
  return urlData.publicUrl;
};

export const saveProject = async (project: Project, userId: string): Promise<void> => {
  try {
    let imageUrl = project.imageUrl;
    if (project.imageUrl?.startsWith('data:')) {
      imageUrl = await uploadImage(project.imageUrl, userId, project.id, 'original');
    }
    const renderingUrls: string[] = [];
    const rendersJsonb: any[] = [];
    for (let i = 0; i < (project.generatedRenderings?.length || 0); i++) {
      const render = project.generatedRenderings[i];
      if (!render) continue;
      let url = render;
      let base64 = render;
      if (render.startsWith('data:')) {
        url = await uploadImage(render, userId, project.id, 'render', i);
        base64 = render;
      }
      renderingUrls.push(url);
      rendersJsonb.push({ url, base64, styleId: project.activeStyleId, timestamp: Date.now() });
    }
    const videos: string[] = [];
    for (let i = 0; i < (project.generatedVideos?.length || 0); i++) {
      const video = project.generatedVideos[i];
      if (video?.startsWith('data:')) {
        videos.push(await uploadImage(video, userId, project.id, 'video', i));
      } else if (video) {
        videos.push(video);
      }
    }
    await supabase.from('projects').upsert({
      id: project.id, user_id: userId, name: project.name, image_url: imageUrl, cover_image: imageUrl,
      renderings: renderingUrls, renders: rendersJsonb, videos: videos, style_id: project.activeStyleId || null,
      lighting: project.lighting || null, environment: project.environment || null, camera_angle: project.cameraAngle || null,
      render_mode: project.renderMode || 'EXTERIOR', room_type: project.roomType || null,
      custom_directives: project.customDirectives || null, updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) { console.error('Failed to save project:', e); }
};

export const loadProjects = async (userId: string): Promise<Project[]> => {
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) return [];
  const projects: Project[] = [];
  for (const p of (data || [])) {
    let generatedRenderings: string[] = [];
    if (p.renders && Array.isArray(p.renders) && p.renders.length > 0) {
      generatedRenderings = await Promise.all(p.renders.map(async (r: any) => {
        if (r.base64 && r.base64.startsWith('data:')) return r.base64;
        if (r.url) return await urlToBase64(r.url);
        return r;
      }));
    } else if (p.renderings && Array.isArray(p.renderings)) {
      generatedRenderings = await Promise.all(p.renderings.map(async (url: string) => {
        if (url.startsWith('data:')) return url;
        return await urlToBase64(url);
      }));
    }
    let imageUrl = p.image_url;
    if (imageUrl && !imageUrl.startsWith('data:')) imageUrl = await urlToBase64(imageUrl);
    projects.push({
      id: p.id, name: p.name || 'Untitled Project', imageUrl, generatedRenderings,
      generatedVideos: p.videos || [], activeStyleId: p.style_id, lighting: p.lighting,
      environment: p.environment, cameraAngle: p.camera_angle, renderMode: p.render_mode || 'EXTERIOR',
      roomType: p.room_type, customDirectives: p.custom_directives, createdAt: p.created_at, updatedAt: p.updated_at
    });
  }
  return projects;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await supabase.from('projects').delete().eq('id', projectId);
};
