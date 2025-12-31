/**
 * CLAD Sharing Service - Project links and social export
 */

import { Project, SharedLink } from '../types';

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
   * Create a shareable link for a project
   */
  createShareLink(
    project: Project,
    options: {
      allowDownload?: boolean;
      requireEmail?: boolean;
      expiresInDays?: number;
    } = {}
  ): SharedLink {
    const shareId = generateShareId();
    const baseUrl = getBaseUrl();
    
    const link: SharedLink = {
      id: shareId,
      url: `${baseUrl}/share/${shareId}`,
      createdAt: Date.now(),
      expiresAt: options.expiresInDays 
        ? Date.now() + (options.expiresInDays * 24 * 60 * 60 * 1000) 
        : undefined,
      allowDownload: options.allowDownload ?? true,
      requireEmail: options.requireEmail ?? false,
      viewCount: 0
    };

    // In production, this would save to Supabase
    // For now, we store in localStorage
    const shares = JSON.parse(localStorage.getItem('clad_shares') || '{}');
    shares[shareId] = {
      projectId: project.id,
      projectName: project.name,
      imageUrl: project.imageUrl,
      renderings: project.generatedRenderings,
      videos: project.generatedVideos,
      ...link
    };
    localStorage.setItem('clad_shares', JSON.stringify(shares));

    return link;
  },

  /**
   * Get shared project data by share ID
   */
  getSharedProject(shareId: string): any | null {
    const shares = JSON.parse(localStorage.getItem('clad_shares') || '{}');
    const share = shares[shareId];
    
    if (!share) return null;
    
    // Check expiration
    if (share.expiresAt && Date.now() > share.expiresAt) {
      return null;
    }
    
    // Increment view count
    share.viewCount = (share.viewCount || 0) + 1;
    shares[shareId] = share;
    localStorage.setItem('clad_shares', JSON.stringify(shares));
    
    return share;
  },

  /**
   * Delete a share link
   */
  deleteShareLink(shareId: string): void {
    const shares = JSON.parse(localStorage.getItem('clad_shares') || '{}');
    delete shares[shareId];
    localStorage.setItem('clad_shares', JSON.stringify(shares));
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

          // Add labels
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

          // Add labels
          ctx.fillStyle = 'rgba(0,0,0,0.7)';
          ctx.fillRect(10, 10, 100, 30);
          ctx.fillRect(10, img1.height + 10, 100, 30);
          
          ctx.fillStyle = 'white';
          ctx.font = 'bold 14px Arial';
          ctx.fillText(beforeLabel, 25, 30);
          ctx.fillText(afterLabel, 25, img1.height + 30);
        }

        // Add watermark
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
   * Share to social media or native share
   */
  async shareToSocial(
    platform: 'instagram' | 'facebook' | 'pinterest' | 'twitter' | 'native',
    imageUrl: string,
    options: {
      title?: string;
      description?: string;
    } = {}
  ): Promise<void> {
    const title = options.title || 'Check out this home design';
    const description = options.description || 'Created with CLAD - AI Architectural Visualization';

    // For native share (mobile)
    if (platform === 'native' && navigator.share) {
      try {
        // Convert base64 to blob for sharing
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'clad-render.jpg', { type: 'image/jpeg' });

        await navigator.share({
          title,
          text: description,
          files: [file]
        });
        return;
      } catch (err) {
        console.error('Native share failed:', err);
      }
    }

    // Fallback: download image
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = 'clad-render.jpg';
    link.click();

    // Show platform-specific message
    const messages: Record<string, string> = {
      instagram: 'Image downloaded! Open Instagram and share from your gallery.',
      facebook: 'Image downloaded! Open Facebook and share from your gallery.',
      pinterest: 'Image downloaded! Open Pinterest and pin from your gallery.',
      twitter: 'Image downloaded! Open Twitter and share from your gallery.',
      native: 'Image downloaded to your device.'
    };

    alert(messages[platform] || messages.native);
  },

  /**
   * Copy share link to clipboard
   */
  async copyLinkToClipboard(url: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (err) {
      // Fallback for older browsers
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
