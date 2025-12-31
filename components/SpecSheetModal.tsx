import React, { useState, useEffect } from 'react';
import { generateSpecSheet, generateSpecSheetPDF, SpecSheet } from '../services/specSheetService';

interface SpecSheetModalProps {
  imageUrl: string;
  styleName: string;
  projectName: string;
  onClose: () => void;
}

export const SpecSheetModal: React.FC<SpecSheetModalProps> = ({
  imageUrl,
  styleName,
  projectName,
  onClose
}) => {
  const [specSheet, setSpecSheet] = useState<SpecSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSpecs = async () => {
      try {
        setLoading(true);
        const specs = await generateSpecSheet(imageUrl, styleName);
        setSpecSheet(specs);
      } catch (e: any) {
        setError('Failed to analyze materials. Please try again.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadSpecs();
  }, [imageUrl, styleName]);

  const handleDownloadPDF = () => {
    if (!specSheet) return;
    const html = generateSpecSheetPDF(specSheet, projectName);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName}-${styleName}-specs.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-serif-display tracking-wide">Material Specifications</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{styleName} Style</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center">
            <i className="fa-solid fa-xmark text-zinc-400"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-zinc-500 text-sm">Analyzing materials...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <i className="fa-solid fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
              <p className="text-zinc-400">{error}</p>
            </div>
          ) : specSheet ? (
            <div className="space-y-4">
              {specSheet.materials.map((material, idx) => (
                <div key={idx} className="bg-black/50 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">{material.category}</span>
                  </div>
                  <p className="text-white text-sm mb-2">{material.description}</p>
                  <p className="text-zinc-400 text-xs mb-1">
                    <span className="text-zinc-600">Suggested Match:</span> {material.suggestedMatch}
                  </p>
                  {material.notes && (
                    <p className="text-zinc-500 text-[10px] italic">{material.notes}</p>
                  )}
                </div>
              ))}
              <p className="text-zinc-600 text-[9px] mt-6 leading-relaxed">{specSheet.disclaimer}</p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {specSheet && (
          <div className="p-4 border-t border-white/10 flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 py-4 bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-400 transition-all"
            >
              <i className="fa-solid fa-download mr-2"></i>
              Download Spec Sheet
            </button>
            <button
              onClick={onClose}
              className="px-6 py-4 bg-white/5 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 transition-all"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecSheetModal;
