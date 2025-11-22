import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Create output directory if it doesn't exist
const outputDir = path.join(process.cwd(), 'apps', 'web', 'public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'apex-immortal-manifesto.pdf');

// Create a new PDF document in landscape orientation (Letter size: 792 x 612 points)
const doc = new PDFDocument({
  size: [792, 612], // Landscape Letter (11" x 8.5")
  margins: { top: 40, bottom: 40, left: 40, right: 40 },
});

// Pipe the PDF to a file
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Colors
const goldColor = '#D4AF37'; // Gold color
const deepPurple1 = '#2D1B69'; // Deep purple start
const deepPurple2 = '#4A2C7F'; // Deep purple mid
const deepPurple3 = '#1A0E4A'; // Deep purple end
const whiteColor = '#FFFFFF';
const lightGold = '#F4D03F';

// Draw deep purple gradient background (simulated with rectangles)
const gradientSteps = 20;
const pageHeight = 612;
const stepHeight = pageHeight / gradientSteps;

for (let i = 0; i < gradientSteps; i++) {
  const ratio = i / (gradientSteps - 1);
  let r, g, b;
  
  // Interpolate between deep purple shades
  if (ratio < 0.5) {
    const t = ratio * 2;
    r = Math.round(45 + (74 - 45) * t); // 2D to 4A
    g = Math.round(27 + (44 - 27) * t); // 1B to 2C
    b = Math.round(105 + (127 - 105) * t); // 69 to 7F
  } else {
    const t = (ratio - 0.5) * 2;
    r = Math.round(74 + (26 - 74) * t); // 4A to 1A
    g = Math.round(44 + (14 - 44) * t); // 2C to 0E
    b = Math.round(127 + (74 - 127) * t); // 7F to 4A
  }
  
  const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  
  doc.rect(0, i * stepHeight, 792, stepHeight + 1)
     .fillColor(color)
     .fill();
}

// Draw border
doc.rect(20, 20, 752, 572)
   .lineWidth(4)
   .strokeColor(goldColor)
   .stroke();

// Draw inner border
doc.rect(40, 40, 712, 532)
   .lineWidth(2)
   .strokeColor(lightGold)
   .stroke();

// Title: "Apex Intelligence – Immortal Manifesto"
doc.fontSize(48)
   .font('Helvetica-Bold')
   .fillColor(goldColor)
   .text('Apex Intelligence', 396, 60, {
     align: 'center',
     width: 700,
   });

doc.fontSize(36)
   .font('Helvetica-Bold')
   .fillColor(goldColor)
   .text('Immortal Manifesto', 396, 110, {
     align: 'center',
     width: 700,
   });

// Subtitle
doc.fontSize(18)
   .font('Helvetica-Oblique')
   .fillColor(lightGold)
   .text('Production Equilibrium Achieved November 19 2025', 396, 165, {
     align: 'center',
     width: 700,
   });

// Draw a decorative line under subtitle
doc.moveTo(100, 195)
   .lineTo(692, 195)
   .lineWidth(1)
   .strokeColor(goldColor)
   .stroke();

// The 6 Guardrails
const guardrails = [
  {
    title: '1. Schema Migration Requirement',
    description: 'Do not add columns in code without updating schema.ts and creating a migration. Every column must have a schema entry and migration.'
  },
  {
    title: '2. Verification Scripts',
    description: 'Do not bypass verify-barrels or verify-schema-sync.ts. These verification scripts are mandatory and must pass before any code is merged.'
  },
  {
    title: '3. CI Pipeline Integrity',
    description: 'Ensure new features pass the full CI pipeline before requesting review. All steps must pass: lint → verify-barrels → verify-schema-sync → verify-drizzle-syntax → test → build.'
  },
  {
    title: '4. LangChain Safety',
    description: 'Preserve LangChain safety. Only use supported LangChain packages. No experimental imports allowed.'
  },
  {
    title: '5. Barrel-Only Imports',
    description: 'Maintain barrel-only imports. All src/lib imports must use barrel exports via @/lib/*. No deep imports.'
  },
  {
    title: '6. Sentry Release Integrity',
    description: 'Maintain Sentry release integrity. All production deployments must create a Sentry release via scripts/create-sentry-release.ts after each deploy.'
  }
];

// Draw guardrails section
let currentY = 220;
doc.fontSize(16)
   .font('Helvetica-Bold')
   .fillColor(goldColor)
   .text('The Six Guardrails', 396, currentY, {
     align: 'center',
     width: 700,
   });

currentY += 30;

// Draw guardrails in two columns
const column1X = 80;
const column2X = 420;
const columnWidth = 300;
let column1Y = currentY;
let column2Y = currentY;

guardrails.forEach((guardrail, index) => {
  const isColumn1 = index % 2 === 0;
  const x = isColumn1 ? column1X : column2X;
  let y = isColumn1 ? column1Y : column2Y;
  
  // Guardrail title
  doc.fontSize(12)
     .font('Helvetica-Bold')
     .fillColor(lightGold)
     .text(guardrail.title, x, y, {
       width: columnWidth,
     });
  
  y += 18;
  
  // Guardrail description
  doc.fontSize(10)
     .font('Helvetica')
     .fillColor(whiteColor)
     .text(guardrail.description, x, y, {
       width: columnWidth,
       lineGap: 3,
     });
  
  // Adjust y for next item in this column
  if (isColumn1) {
    column1Y = y + 45;
  } else {
    column2Y = y + 45;
  }
});

// Victory commit hashes
currentY = Math.max(column1Y, column2Y) + 20;
doc.fontSize(14)
   .font('Helvetica-Bold')
   .fillColor(goldColor)
   .text('Victory Commit Hashes', 396, currentY, {
     align: 'center',
     width: 700,
   });

currentY += 25;

const commitHashes = ['225aa69', 'f0a1d99', 'af4f277', 'e6987ea'];
const hashText = commitHashes.join('  •  ');

doc.fontSize(11)
   .font('Helvetica')
   .fillColor(whiteColor)
   .text(hashText, 396, currentY, {
     align: 'center',
     width: 700,
   });

// Center text: "This platform will never break again."
currentY += 40;
doc.fontSize(28)
   .font('Helvetica-Bold')
   .fillColor(goldColor)
   .text('This platform will never break again.', 396, currentY, {
     align: 'center',
     width: 700,
   });

// Gold seal icon (circle with star) in bottom-right corner
const sealCenterX = 720;
const sealCenterY = 550;
const sealRadius = 40;

// Outer gold circle
doc.circle(sealCenterX, sealCenterY, sealRadius)
   .lineWidth(3)
   .strokeColor(goldColor)
   .stroke();

// Inner circle
doc.circle(sealCenterX, sealCenterY, sealRadius - 8)
   .lineWidth(2)
   .strokeColor(lightGold)
   .stroke();

// Star pattern inside seal
const starPoints = 8;
const starRadius = 25;
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

// Center dot
doc.circle(sealCenterX, sealCenterY, 2)
   .fillColor(goldColor)
   .fill();

// Signature line: "Signed, Grok"
const signatureY = 520;
doc.fontSize(16)
   .font('Helvetica-Oblique')
   .fillColor(lightGold)
   .text('Signed,', 396, signatureY, {
     align: 'center',
     width: 700,
   });

doc.fontSize(22)
   .font('Helvetica-Bold')
   .fillColor(goldColor)
   .text('Grok', 396, signatureY + 20, {
     align: 'center',
     width: 700,
   });

// Finalize the PDF
doc.end();

stream.on('finish', () => {
  console.log('✅ Apex Intelligence Immortal Manifesto PDF generated successfully!');
  console.log(`📄 Saved to: ${outputPath}`);
});

stream.on('error', (err) => {
  console.error('❌ Error generating PDF:', err);
  process.exit(1);
});

