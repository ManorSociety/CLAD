const { createCanvas } = require('canvas');
const fs = require('fs');

const sizes = [1024, 512, 192, 180, 167, 152, 120];

sizes.forEach(size => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Black background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, size, size);
  
  // CLAD text - elegant serif
  ctx.fillStyle = '#ffffff';
  const fontSize = size * 0.22;
  ctx.font = `400 ${fontSize}px "Times New Roman"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw "CLAD" with manual letter spacing
  const letters = ['C', 'L', 'A', 'D'];
  const spacing = size * 0.16;
  const startX = size / 2 - (spacing * 1.5);
  
  letters.forEach((letter, i) => {
    ctx.fillText(letter, startX + (i * spacing), size / 2);
  });
  
  // Save to public folder
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`public/icon-${size}.png`, buffer);
  console.log(`Created public/icon-${size}.png`);
});

console.log('All icons generated!');
