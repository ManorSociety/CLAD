import jsPDF from 'jspdf';
import { Project, DesignStyle } from '../types';

export const generateProjectPDF = async (
  project: Project,
  style: DesignStyle,
  userName?: string
): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [1920, 1080]
  });

  const pageWidth = 1920;
  const pageHeight = 1080;

  // Helper to load image as base64
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // ============ COVER PAGE ============
  pdf.setFillColor(0, 0, 0);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // CLAD Logo
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(48);
  pdf.text('CLAD', 100, 120);

  // Project Name
  pdf.setFontSize(120);
  pdf.text(project.name.toUpperCase(), 100, pageHeight / 2);

  // Style
  pdf.setFontSize(32);
  pdf.setTextColor(180, 180, 180);
  pdf.text(style.name + ' Style', 100, pageHeight / 2 + 80);

  // Date
  pdf.setFontSize(24);
  pdf.text(new Date(project.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), 100, pageHeight / 2 + 140);

  // Footer
  pdf.setFontSize(16);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Generated with CLAD | cladrender.com', 100, pageHeight - 60);
  if (userName) {
    pdf.text(`Prepared by: ${userName}`, 100, pageHeight - 90);
  }

  // ============ BEFORE PAGE ============
  pdf.addPage([1920, 1080], 'landscape');
  pdf.setFillColor(0, 0, 0);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Title
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EXISTING STRUCTURE', 100, 80);

  // Before image
  try {
    const beforeImg = await loadImage(project.imageUrl);
    const imgRatio = beforeImg.width / beforeImg.height;
    const maxWidth = pageWidth - 200;
    const maxHeight = pageHeight - 200;
    
    let drawWidth = maxWidth;
    let drawHeight = drawWidth / imgRatio;
    
    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = drawHeight * imgRatio;
    }
    
    const x = (pageWidth - drawWidth) / 2;
    const y = 120;
    
    pdf.addImage(project.imageUrl, 'JPEG', x, y, drawWidth, drawHeight);
  } catch (e) {
    console.error('Failed to load before image', e);
  }

  // ============ AFTER PAGES ============
  if (project.generatedRenderings && project.generatedRenderings.length > 0) {
    for (let i = 0; i < project.generatedRenderings.length; i++) {
      pdf.addPage([1920, 1080], 'landscape');
      pdf.setFillColor(0, 0, 0);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      // Title
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${style.name.toUpperCase()} RENDERING ${i + 1}`, 100, 80);

      // Rendered image
      try {
        const rendering = project.generatedRenderings[i];
        const afterImg = await loadImage(rendering);
        const imgRatio = afterImg.width / afterImg.height;
        const maxWidth = pageWidth - 200;
        const maxHeight = pageHeight - 200;
        
        let drawWidth = maxWidth;
        let drawHeight = drawWidth / imgRatio;
        
        if (drawHeight > maxHeight) {
          drawHeight = maxHeight;
          drawWidth = drawHeight * imgRatio;
        }
        
        const x = (pageWidth - drawWidth) / 2;
        const y = 120;
        
        pdf.addImage(rendering, 'JPEG', x, y, drawWidth, drawHeight);
      } catch (e) {
        console.error('Failed to load rendering', e);
      }

      // Footer with style info
      pdf.setFontSize(14);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Style DNA: ${style.dna.substring(0, 100)}...`, 100, pageHeight - 40);
    }
  }

  // ============ COMPARISON PAGE ============
  if (project.generatedRenderings && project.generatedRenderings.length > 0) {
    pdf.addPage([1920, 1080], 'landscape');
    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Title
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BEFORE & AFTER COMPARISON', pageWidth / 2, 60, { align: 'center' });

    const halfWidth = (pageWidth - 150) / 2;
    const imgHeight = pageHeight - 200;

    // Before (left)
    try {
      pdf.addImage(project.imageUrl, 'JPEG', 50, 100, halfWidth, imgHeight);
      pdf.setFontSize(16);
      pdf.text('BEFORE', 50 + halfWidth / 2, pageHeight - 50, { align: 'center' });
    } catch (e) {}

    // After (right)
    try {
      const lastRendering = project.generatedRenderings[project.generatedRenderings.length - 1];
      pdf.addImage(lastRendering, 'JPEG', 100 + halfWidth, 100, halfWidth, imgHeight);
      pdf.text('AFTER', 100 + halfWidth + halfWidth / 2, pageHeight - 50, { align: 'center' });
    } catch (e) {}
  }

  // Save
  const fileName = `${project.name.replace(/[^a-z0-9]/gi, '_')}_${style.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};
