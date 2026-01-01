/**
 * CLAD Sharing Service - Project links and social export
 */

import { Project, SharedLink } from '../types';
import { supabase } from './supabaseClient';

// Generate a unique share ID
const generateShareId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get base URL for sharing
const getBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://cladrender.com';
};

export const sharingService = {
  /**
   * Create a shareable link for a project - saves to Supabase
   */
  async createShareLink(
    project: Project,
    options: {
      allowDownload?: boolean;
      requireEmail?: boolean;
      expiresInDays?: number;
    } = {}
  ): Promise<SharedLink | null> {
    const shareId = generateShareId();
    const baseUrl = getBaseUrl();
    
    const expiresAt = options.expiresInDays 
      ? new Date(Date.now() + (options.expiresInDays * 24 * 60 * 60 * 1000)).toISOString()
      : null;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('shares').insert({
      id: shareId,
      project_name: project.name,
      image_url: project.imageUrl,
      renderings: project.generatedRenderings || [],
      videos: project.generatedVideos || [],
      allow_download: options.allowDownload ?? true,
      require_email: options.requireEmail ?? false,
      expires_at: expiresAt,
      user_id: user?.id
    });

    if (error) {
      console.error('Error creating share:', error);
      return null;
    }

    return {
      id: shareId,
      url: `${baseUrl}/share/${shareId}`,
      createdAt: Date.now(),
      expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
      allowDownload: options.allowDownload ?? true,
      requireEmail: options.requireEmail ?? false,
      viewCount: 0
    };
  },

  /**
   * Get shared project data by share ID from Supabase
   */
  async getSharedProject(shareId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('shares')
      .select('*')
      .eq('id', shareId)
      .single();
    
    if (error || !data) return null;
    
    // Check expiration
    if (data.expires_at && new Date() > new Date(data.expires_at)) {
      return null;
    }
    
    // Increment view count
    await supabase
      .from('shares')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('id', shareId);
    
    return data;
  },

  /**
   * Delete a share link
   */
  async deleteShareLink(shareId: string): Promise<void> {
    await supabase.from('shares').delete().eq('id', shareId);
  },

  /**
   * Create a before/after comparison image for social sharing
   */
  async createComparisonImage(
    beforeImage: string,
    afterImage: string,
    options: {
      layout?: 'side-by-side' | 'stacked';
      addWatermark?: boolean;
      beforeLabel?: string;
      afterLabel?: string;
    } = {}
  ): Promise<string> {
    const layout = options.layout || 'side-by-side';
    const addWatermark = options.addWatermark ?? true;
    const beforeLabel = options.beforeLabel || 'BEFORE';
    const afterLabel = options.afterLabel || 'AFTER';

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const img1 = new Image();
      const img2 = new Image();
      let loaded = 0;

      const onLoad = () => {
        loaded++;
        if (loaded < 2) return;

        if (layout === 'side-by-side') {
          canvas.width = img1.width + img2.width;
          canvas.height = Math.max(img1.height, img2.height);
          
          ctx.drawImage(img1, 0, 0);
          ctx.drawImage(img2, img1.width, 0);

          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(10, 10, 100, 30);
          ctx.fillRect(img1.width + 10, 10, 100, 30);
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(beforeLabel, 25, 30);
          ctx.fillText(afterLabel, img1.width + 25, 30);
        } else {
          canvas.width = Math.max(img1.width, img2.width);
          canvas.height = img1.height + img2.height;
          
          ctx.drawImage(img1, 0, 0);
          ctx.drawImage(img2, 0, img1.height);

          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(10, 10, 100, 30);
          ctx.fillRect(10, img1.height + 10, 100, 30);
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(beforeLabel, 25, 30);
          ctx.fillText(afterLabel, 25, img1.height + 30);
        }

        if (addWatermark) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          const wmWidth = 150;
          const wmHeight = 30;
          ctx.fillRect(canvas.width - wmWidth - 10, canvas.height - wmHeight - 10, wmWidth, wmHeight);
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px Arial';
          ctx.fillText('Made with CLAD', canvas.width - wmWidth + 10, canvas.height - 18);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img1.onload = onLoad;
      img2.onload = onLoad;
      img1.onerror = reject;
      img2.onerror = reject;

      img1.src = beforeImage;
      img2.src = afterImage;
    });
  },

  /**
   * Share via email - opens email client
   */
  shareViaEmail(shareUrl: string, projectName: string): void {
    const subject = encodeURIComponent(`Check out this home design: ${projectName}`);
    const body = encodeURIComponent(`I wanted to share this architectural visualization with you:\n\n${shareUrl}\n\nCreated with CLAD - AI Architectural Visualization`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  },

  /**
   * Copy share link to clipboard
   */
  async copyLinkToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    }
  }
};
