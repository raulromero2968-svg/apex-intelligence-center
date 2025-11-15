#!/usr/bin/env node

/**
 * Apex Intelligence - Apply Enhancements to All HTML Pages
 *
 * This script adds the enhancement CSS and JS files to all HTML pages
 * that don't already have them.
 */

const fs = require('fs');
const path = require('path');

// Files to process
const htmlFiles = [
    'intel.html',
    'insights.html',
    'blog.html',
    'research.html',
    'about.html',
    'account.html',
    'company.html',
    'article.html',
    'success.html',
    'privacy.html',
    'terms.html',
    'disclaimer.html',
    'tool-calculator.html',
    'tool-arbitrage.html',
    'tool-grading.html',
    'tool-sealed.html',
    'tool-tracker.html',
    'tool-tax-dashboard.html',
    'tool-tax-harvesting.html',
    'tool-tax-optimizer.html',
    'tool-tax-scenario.html',
    'tool-tax-reports.html',
    'tool-set-completion.html'
];

// CSS link to add
const cssLink = '<link rel="stylesheet" href="apex-enhancements.css">';

// Cursor elements to add after <body>
const cursorElements = `    <!-- Custom Cursor (Desktop Only) -->
    <div class="custom-cursor" id="customCursor"></div>
    <div class="cursor-follower" id="cursorFollower"></div>

`;

// Script to add before </body>
const enhancementScript = `
    <!-- Apex Enhancements -->
    <script src="apex-enhancements.js"></script>`;

let updatedCount = 0;
let skippedCount = 0;
let errorCount = 0;

console.log('🚀 Applying Apex Intelligence Enhancements...\n');

htmlFiles.forEach(filename => {
    const filepath = path.join(__dirname, filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
        console.log(`⏭️  Skipping ${filename} (file not found)`);
        skippedCount++;
        return;
    }

    try {
        let content = fs.readFileSync(filepath, 'utf8');
        let modified = false;

        // 1. Add CSS link if not present
        if (!content.includes('apex-enhancements.css')) {
            // Find the last <link> tag or favicon, or the closing </head>
            if (content.includes('<link rel="icon"')) {
                content = content.replace(
                    /(<link rel="icon"[^>]*>)/,
                    `$1\n    ${cssLink}`
                );
            } else if (content.includes('</head>')) {
                content = content.replace(
                    /([\s]*)<\/head>/,
                    `    ${cssLink}\n$1</head>`
                );
            }
            modified = true;
        }

        // 2. Add cursor elements if not present
        if (!content.includes('id="customCursor"')) {
            content = content.replace(
                /(<body[^>]*>)\s*/,
                `$1\n${cursorElements}`
            );
            modified = true;
        }

        // 3. Add enhancement script if not present
        if (!content.includes('apex-enhancements.js')) {
            content = content.replace(
                /([\s]*)<\/body>/,
                `${enhancementScript}\n$1</body>`
            );
            modified = true;
        }

        // Write back if modified
        if (modified) {
            fs.writeFileSync(filepath, content, 'utf8');
            console.log(`✅ Updated ${filename}`);
            updatedCount++;
        } else {
            console.log(`⏭️  Skipping ${filename} (already has enhancements)`);
            skippedCount++;
        }

    } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
        errorCount++;
    }
});

console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log(`   ✅ Updated: ${updatedCount}`);
console.log(`   ⏭️  Skipped: ${skippedCount}`);
console.log(`   ❌ Errors: ${errorCount}`);
console.log('='.repeat(50));
console.log('\n✨ Enhancement application complete!\n');
