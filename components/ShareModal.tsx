/**
 * Share Modal Component
 */

import React, { useState } from 'react';
import { Project, SharedLink } from '../types';
import { sharingService } from '../services/sharingService';

interface ShareModalProps {
  project: Project;
  selectedImage?: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ project, selectedImage, onClose }) => {
  const [shareLink, setShareLink] = useState<SharedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [requireEmail, setRequireEmail] = useState(false);
  const [expiresIn30Days, setExpiresIn30Days] = useState(true);

  const handleCreateLink = async () => {
    setIsCreating(true);
    try {
      const link = await sharingService.createShareLink(project, { 
        allowDownload, 
        requireEmail, 
        expiresInDays: expiresIn30Days ? 30 : undefined 
      });
      setShareLink(link);
    } catch (err) {
      console.error('Failed to create share link:', err);
      alert('Failed to create share link. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareLink) return;
    const success = await sharingService.copyLinkToClipboard(shareLink.url);
    if (success) { 
      setCopied(true); 
      setTimeout(() => setCopied(false), 2000); 
    }
  };

  const handleEmailShare = () => {
    if (shareLink) {
      sharingService.shareViaEmail(shareLink.url, project.name);
    } else {
      // Create link first, then share via email
      handleCreateLink().then(() => {
        if (shareLink) {
          sharingService.shareViaEmail(shareLink.url, project.name);
        }
      });
    }
  };

  const handleDownloadImage = () => {
    const imageToShare = selectedImage || project.generatedRenderings?.[0] || project.imageUrl;
    const link = document.createElement('a');
    link.href = imageToShare;
    link.download = `${project.name.toLowerCase().replace(/\s+/g, '-')}-render.jpg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-[2500] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h3 className="text-lg font-serif-display uppercase tracking-wider">Share Project</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>

        <div className="p-6 space-y-6">
          {/* Share Link Section */}
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">Anyone with this link can view your project:</p>
            {!shareLink ? (
              <button 
                onClick={handleCreateLink} 
                disabled={isCreating}
                className="w-full py-4 bg-amber-500 text-black text-xs font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Generate Share Link'}
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={shareLink.url} 
                    readOnly 
                    className="flex-1 bg-black border border-white/10 px-4 py-3 text-sm rounded-lg text-zinc-400" 
                  />
                  <button 
                    onClick={handleCopyLink} 
                    className={`px-4 py-3 text-xs font-black rounded-lg ${copied ? 'bg-emerald-500' : 'bg-amber-500'} text-black`}
                  >
                    <i className={`fa-solid ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                  </button>
                </div>
                {/* Email share after link is created */}
                <button 
                  onClick={() => sharingService.shareViaEmail(shareLink.url, project.name)}
                  className="w-full py-3 border border-white/20 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-envelope"></i> Share via Email
                </button>
              </div>
            )}
          </div>

          {/* Export Section */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Export</p>
            <button 
              onClick={handleDownloadImage} 
              className="w-full py-4 border border-white/20 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3"
            >
              <i className="fa-solid fa-download"></i> Download Image
            </button>
          </div>

          {/* Permissions Section */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Permissions</p>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Allow downloads</span>
              <input 
                type="checkbox" 
                checked={allowDownload} 
                onChange={(e) => setAllowDownload(e.target.checked)} 
                className="w-5 h-5 accent-amber-500" 
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Require email to view</span>
              <input 
                type="checkbox" 
                checked={requireEmail} 
                onChange={(e) => setRequireEmail(e.target.checked)} 
                className="w-5 h-5 accent-amber-500" 
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Link expires in 30 days</span>
              <input 
                type="checkbox" 
                checked={expiresIn30Days} 
                onChange={(e) => setExpiresIn30Days(e.target.checked)} 
                className="w-5 h-5 accent-amber-500" 
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
