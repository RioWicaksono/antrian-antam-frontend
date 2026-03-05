#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates PNG icons for PWA in the correct sizes
 * 
 * Requirements: npm install sharp
 * Usage: node generate-icons.js
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, 'public');

// Ensure public directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// SVG template for the icon (can be customized)
const createSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#0f172a"/>
  
  <!-- Gradient circle -->
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#eab308;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#facc15;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Circle badge -->
  <circle cx="${size/2}" cy="${size/2}" r="${size/2.5}" fill="url(#grad${size})"/>
  
  <!-- Letter "A" for Antrian -->
  <text x="${size/2}" y="${size/1.7}" font-size="${size/2.5}" font-weight="bold" 
        font-family="Arial, sans-serif" text-anchor="middle" fill="#0f172a">A</text>
</svg>
`;

const generateIcon = async (size, isMaskable = false) => {
  const svg = createSVG(size);
  const filename = isMaskable 
    ? `pwa-maskable-${size}x${size}.png`
    : `pwa-${size}x${size}.png`;
  
  const filepath = path.join(OUTPUT_DIR, filename);
  
  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filepath);
    
    console.log(`✅ Created ${filename} (${size}x${size})`);
  } catch (error) {
    console.error(`❌ Error creating ${filename}:`, error.message);
  }
};

const generateAppleTouchIcon = async () => {
  const svg = createSVG(180);
  const filepath = path.join(OUTPUT_DIR, 'apple-touch-icon.png');
  
  try {
    await sharp(Buffer.from(svg))
      .png()
      .toFile(filepath);
    
    console.log(`✅ Created apple-touch-icon.png (180x180)`);
  } catch (error) {
    console.error(`❌ Error creating apple-touch-icon.png:`, error.message);
  }
};

const generateFavicon = async () => {
  const svg = createSVG(64);
  const filepath = path.join(OUTPUT_DIR, 'favicon.png');
  
  try {
    await sharp(Buffer.from(svg))
      .resize(32, 32)
      .png()
      .toFile(filepath);
    
    console.log(`✅ Created favicon.png (32x32)`);
  } catch (error) {
    console.error(`❌ Error creating favicon.png:`, error.message);
  }
};

const main = async () => {
  console.log('🚀 Generating PWA Icons...\n');
  
  try {
    // Generate standard icons
    await generateIcon(192);
    await generateIcon(512);
    
    // Generate maskable icons (for adaptive launcher icons on Android)
    await generateIcon(192, true);
    await generateIcon(512, true);
    
    // Generate Apple touch icon for iOS
    await generateAppleTouchIcon();
    
    // Generate favicon
    await generateFavicon();
    
    console.log('\n✨ All icons generated successfully!');
    console.log(`📁 Icons saved to: ${OUTPUT_DIR}`);
    console.log('\n💡 You can now customize these icons by:');
    console.log('   1. Replacing the SVG template in this script');
    console.log('   2. Uploading your own logo for conversion');
    console.log('   3. Using an online tool like favicon-generator.org');
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
};

main();
