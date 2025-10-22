#!/usr/bin/env node

/**
 * Favicon Verification Script
 * 
 * This script verifies that all favicon files are present and provides
 * instructions for testing the new favicon setup.
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

console.log('🔍 Favicon Verification Script\n');

// List of required favicon files
const requiredFiles = [
    'favicon.ico',
    'favicon-16x16.png',
    'favicon-32x32.png',
    'apple-touch-icon.png',
    'android-chrome-192x192.png',
    'android-chrome-512x512.png'
];

console.log('📋 Checking Favicon Files:');
console.log('=========================\n');

let allPresent = true;

requiredFiles.forEach((file, index) => {
    const filePath = path.join(publicDir, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    
    if (!exists) allPresent = false;
    
    console.log(`${index + 1}. ${status} ${file}`);
    
    if (exists) {
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(1);
        console.log(`   Size: ${sizeKB} KB, Modified: ${stats.mtime.toLocaleDateString()}`);
    }
});

console.log('\n📱 Additional Files:');
console.log('===================\n');

const additionalFiles = ['newlogo.png', 'logo.png', 'site.webmanifest'];
additionalFiles.forEach(file => {
    const filePath = path.join(publicDir, file);
    const exists = fs.existsSync(filePath);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
});

if (allPresent) {
    console.log('\n🎉 All required favicon files are present!');
    console.log('\n🧪 Testing Instructions:');
    console.log('=======================\n');
    console.log('1. Start your development server: npm run dev');
    console.log('2. Open your browser and navigate to: http://localhost:3000');
    console.log('3. Check the browser tab for your new favicon');
    console.log('4. Test favicon pages:');
    console.log('   • http://localhost:3000/favicon-test');
    console.log('   • http://localhost:3000/favicon-debug');
    console.log('5. Clear browser cache if you don\'t see changes');
    console.log('6. Test on mobile devices (add to home screen)');
    
    console.log('\n🔧 Browser Cache Clearing:');
    console.log('=========================\n');
    console.log('• Chrome: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
    console.log('• Firefox: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)');
    console.log('• Safari: Cmd+Option+R (Mac)');
    console.log('• Edge: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)');
    
} else {
    console.log('\n⚠️  Some favicon files are missing!');
    console.log('\n📝 Next Steps:');
    console.log('==============\n');
    console.log('1. Use the conversion script: node scripts/convert-favicon.js');
    console.log('2. Follow the conversion instructions');
    console.log('3. Replace the missing files in /public directory');
    console.log('4. Run this verification script again');
}

console.log('\n✨ Favicon setup complete when all files are present!');
