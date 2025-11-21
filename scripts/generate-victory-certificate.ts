import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'apps', 'web', 'public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'victory-certificate.pdf');

// Create a new PDF document in landscape orientation (Letter size: 792 x 612 points)
const doc = new PDFDocument({
  size: [792, 612], // Landscape Letter (11" x 8.5")
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
});

// Pipe the PDF to a file
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Draw dark border (thick, elegant frame)
const borderWidth = 8;
const goldColor = '#D4AF37'; // Gold color
const darkColor = '#1a1a1a'; // Dark border color

// Draw outer dark border
doc.rect(20, 20, 752, 572)
   .lineWidth(borderWidth)
   .strokeColor(darkColor)
   .stroke();

// Draw inner gold border
doc.rect(40, 40, 712, 532)
   .lineWidth(3)
   .strokeColor(goldColor)
   .stroke();

// Draw decorative corner elements
const cornerSize = 30;
const cornerWidth = 2;

// Top-left corner
doc.moveTo(50, 50)
   .lineTo(50 + cornerSize, 50)
   .lineTo(50, 50 + cornerSize)
   .lineWidth(cornerWidth)
   .strokeColor(goldColor)
   .stroke();

// Top-right corner
doc.moveTo(742, 50)
   .lineTo(742 - cornerSize, 50)
   .lineTo(742, 50 + cornerSize)
   .lineWidth(cornerWidth)
   .strokeColor(goldColor)
   .stroke();

// Bottom-left corner
doc.moveTo(50, 562)
   .lineTo(50 + cornerSize, 562)
   .lineTo(50, 562 - cornerSize)
   .lineWidth(cornerWidth)
   .strokeColor(goldColor)
   .stroke();

// Bottom-right corner
doc.moveTo(742, 562)
   .lineTo(742 - cornerSize, 562)
   .lineTo(742, 562 - cornerSize)
   .lineWidth(cornerWidth)
   .strokeColor(goldColor)
   .stroke();

// Draw gold circular seal in the center-top area
const sealCenterX = 396; // Center of page
const sealCenterY = 150;
const sealRadius = 60;
const sealInnerRadius = 50;

// Outer gold circle (seal)
doc.circle(sealCenterX, sealCenterY, sealRadius)
   .lineWidth(4)
   .strokeColor(goldColor)
   .stroke();

// Inner gold circle
doc.circle(sealCenterX, sealCenterY, sealInnerRadius)
   .lineWidth(2)
   .strokeColor(goldColor)
   .stroke();

// Add decorative elements inside seal (star pattern)
const starPoints = 8;
const starRadius = 35;
for (let i = 0; i < starPoints; i++) {
  const angle = (i * Math.PI * 2) / starPoints;
  const x = sealCenterX + Math.cos(angle) * starRadius;
  const y = sealCenterY + Math.sin(angle) * starRadius;
  if (i === 0) {
    doc.moveTo(x, y);
  } else {
    doc.lineTo(x, y);
  }
}
doc.closePath()
   .lineWidth(1.5)
   .strokeColor(goldColor)
   .stroke();

// Add center dot
doc.circle(sealCenterX, sealCenterY, 3)
   .fillColor(goldColor)
   .fill();

// Title: "Apex Intelligence Victory Certificate"
doc.fontSize(42)
   .font('Helvetica-Bold')
   .fillColor(darkColor)
   .text('Apex Intelligence', 396, 250, {
     align: 'center',
     width: 700,
   });

doc.fontSize(36)
   .font('Helvetica-Bold')
   .fillColor(darkColor)
   .text('Victory Certificate', 396, 300, {
     align: 'center',
     width: 700,
   });

// Main certification text
doc.fontSize(20)
   .font('Helvetica')
   .fillColor('#333333')
   .text('This certifies that Apex Intelligence has achieved', 396, 380, {
     align: 'center',
     width: 700,
   });

doc.fontSize(20)
   .font('Helvetica')
   .fillColor('#333333')
   .text('Production Equilibrium and attained immortality', 396, 410, {
     align: 'center',
     width: 700,
   });

doc.fontSize(20)
   .font('Helvetica')
   .fillColor('#333333')
   .text('on November 19 2025.', 396, 440, {
     align: 'center',
     width: 700,
   });

// Signature line
const signatureY = 500;
doc.fontSize(18)
   .font('Helvetica-Oblique')
   .fillColor(goldColor)
   .text('Signed,', 396, signatureY, {
     align: 'center',
     width: 700,
   });

doc.fontSize(24)
   .font('Helvetica-Bold')
   .fillColor(goldColor)
   .text('Grok', 396, signatureY + 25, {
     align: 'center',
     width: 700,
   });

// Date
doc.fontSize(16)
   .font('Helvetica')
   .fillColor('#666666')
   .text('November 19 2025', 396, signatureY + 70, {
     align: 'center',
     width: 700,
   });

// Finalize the PDF
doc.end();

stream.on('finish', () => {
  console.log('✅ Victory Certificate PDF generated successfully!');
  console.log(`📄 Saved to: ${outputPath}`);
});

stream.on('error', (err) => {
  console.error('❌ Error generating PDF:', err);
  process.exit(1);
});


