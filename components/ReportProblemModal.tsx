/**
 * Report Problem Modal Component
 */

import React, { useState } from 'react';
import { backendService } from '../services/backendService';

interface ReportProblemModalProps {
  onClose: () => void;
  projectId?: string;
}

export const ReportProblemModal: React.FC<ReportProblemModalProps> = ({ onClose, projectId }) => {
  const [type, setType] = useState<'bug' | 'feature' | 'billing' | 'other'>('bug');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await backendService.submitSupportTicket({ type, subject, description, projectId });
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300">
        <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[2rem] p-12 text-center space-y-8">
          <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-check text-3xl text-emerald-500"></i>
          </div>
          <h3 className="text-3xl font-serif-display uppercase tracking-tight">Received</h3>
          <p className="text-zinc-500 text-[11px] uppercase tracking-widest leading-relaxed">Your report has been submitted. Our team will review it within 24 hours.</p>
          <button onClick={onClose} className="w-full py-5 bg-white text-black text-[11px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[3000] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-8 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-lg rounded-[2rem] p-10 space-y-8 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-serif-display uppercase tracking-tight">Report a Problem</h3>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Issue Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'bug', label: 'Bug', icon: 'fa-bug' },
                { value: 'feature', label: 'Feature', icon: 'fa-lightbulb' },
                { value: 'billing', label: 'Billing', icon: 'fa-credit-card' },
                { value: 'other', label: 'Other', icon: 'fa-ellipsis' }
              ].map((option) => (
                <button key={option.value} type="button" onClick={() => setType(option.value as any)}
                  className={`p-4 border text-left transition-all flex items-center gap-3 ${type === option.value ? 'border-white bg-white/5' : 'border-white/10 hover:border-white/30'}`}>
                  <i className={`fa-solid ${option.icon} text-xs ${type === option.value ? 'text-white' : 'text-zinc-600'}`}></i>
                  <span className={`text-[10px] font-black uppercase tracking-widest ${type === option.value ? 'text-white' : 'text-zinc-500'}`}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief description..."
              className="w-full bg-black border border-white/10 p-4 text-[11px] tracking-wide focus:border-white focus:outline-none transition-colors placeholder-zinc-700 uppercase" required />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please provide details..."
              rows={5} className="w-full bg-black border border-white/10 p-4 text-[11px] tracking-wide focus:border-white focus:outline-none transition-colors placeholder-zinc-700 resize-none" required />
          </div>
          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-5 border border-white/10 text-zinc-500 text-[10px] font-black uppercase tracking-widest hover:border-white/30 transition-all">Cancel</button>
            <button type="submit" disabled={isSubmitting || !subject.trim() || !description.trim()}
              className="flex-1 py-5 bg-white text-black text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50">
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportProblemModal;
