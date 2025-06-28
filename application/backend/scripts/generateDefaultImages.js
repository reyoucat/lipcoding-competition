const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function generateDefaultImage(text, filename, bgColor = '#6366f1', textColor = '#ffffff') {
  // Create a 500x500 canvas
  const canvas = createCanvas(500, 500);
  const ctx = canvas.getContext('2d');

  // Fill background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 500, 500);
  gradient.addColorStop(0, bgColor);
  gradient.addColorStop(1, adjustBrightness(bgColor, -20));
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 500, 500);

  // Add subtle pattern
  ctx.strokeStyle = adjustBrightness(bgColor, 10);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 500; i += 20) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 500);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(500, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Draw circle background
  ctx.beginPath();
  ctx.arc(250, 250, 150, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = 'bold 48px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Add text shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  ctx.fillText(text, 250, 250);

  // Save the image
  const publicDir = path.join(__dirname, '../public/images');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(publicDir, filename), buffer);
  
  console.log(`Generated ${filename}`);
}

function adjustBrightness(hex, percent) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse r, g, b values
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Generate default images
console.log('Generating default profile images...');

// Mentor image - Blue theme
generateDefaultImage('MENTOR', 'default-mentor.png', '#3b82f6', '#ffffff');

// Mentee image - Green theme  
generateDefaultImage('MENTEE', 'default-mentee.png', '#10b981', '#ffffff');

console.log('Default images generated successfully!');
