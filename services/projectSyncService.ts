import { supabase } from './supabaseClient';
import { Project } from '../types';

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
    for (let i = 0; i < (project.generatedRenderings?.length || 0); i++) {
      const render = project.generatedRenderings[i];
      if (!render) continue;
      if (render.startsWith('data:')) {
        renderingUrls.push(await uploadImage(render, userId, project.id, 'render', i));
      } else {
        renderingUrls.push(render);
      }
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
      renderings: renderingUrls, videos: videos, style_id: project.activeStyleId || null,
      lighting: project.lighting || null, environment: project.environment || null, camera_angle: project.cameraAngle || null,
      render_mode: project.renderMode || 'EXTERIOR', room_type: project.roomType || null,
      custom_directives: project.customDirectives || null,
      hd_versions: project.hdVersions || null,
      hd_video_versions: project.hdVideoVersions || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
  } catch (e) { console.error('Failed to save project:', e); }
};

export const loadProjects = async (userId: string): Promise<Project[]> => {
  const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('updated_at', { ascending: false });
  if (error) return [];
  
  return (data || []).map(p => ({
    id: p.id,
    name: p.name || 'Untitled Project',
    imageUrl: p.image_url || p.cover_image,
    generatedRenderings: p.renderings || [],
    generatedVideos: p.videos || [],
    activeStyleId: p.style_id,
    lighting: p.lighting,
    environment: p.environment,
    cameraAngle: p.camera_angle,
    renderMode: p.render_mode || 'EXTERIOR',
    roomType: p.room_type,
    customDirectives: p.custom_directives,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    hdVersions: p.hd_versions || {},
    hdVideoVersions: p.hd_video_versions || {}
  }));
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await supabase.from('projects').delete().eq('id', projectId);
};
