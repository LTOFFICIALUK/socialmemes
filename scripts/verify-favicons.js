#!/usr/bin/env node

/**
 * Favicon Verification Script
 * 
 * This script checks if all required favicon files exist in the public directory
 * and provides helpful feedback on what's missing.
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

const requiredFiles = [
  'favicon.ico',
  'favicon-16x16.png',
  'favicon-32x32.png',
  'apple-touch-icon.png',
  'android-chrome-192x192.png',
  'android-chrome-512x512.png',
  'og-image.png',
  'twitter-image.png',
  'site.webmanifest'
];

console.log('🔍 Checking favicon files...\n');

let missingFiles = [];
let existingFiles = [];

requiredFiles.forEach(file => {
  const filePath = path.join(publicDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`✅ ${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    existingFiles.push(file);
  } else {
    console.log(`❌ ${file} - MISSING`);
    missingFiles.push(file);
  }
});

console.log('\n📊 Summary:');
console.log(`✅ Found: ${existingFiles.length}/${requiredFiles.length} files`);
console.log(`❌ Missing: ${missingFiles.length} files`);

if (missingFiles.length > 0) {
  console.log('\n🚨 Missing files:');
  missingFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  
  console.log('\n📖 Next steps:');
  console.log('1. Follow the instructions in FAVICON_SETUP.md');
  console.log('2. Use an online favicon generator like favicon.io');
  console.log('3. Run this script again to verify all files are present');
} else {
  console.log('\n🎉 All favicon files are present! Your favicon setup is complete.');
}

console.log('\n💡 Pro tip: Clear your browser cache after adding new favicons to see the changes.');
