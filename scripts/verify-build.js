#!/usr/bin/env node
/**
 * Build Verification Script
 * Ensures production build is safe to deploy (no raw JSX files, proper MIME types)
 * Prevents "MIME type of text/jsx" errors in production
 */

import { readdir, stat, readFile } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

const DIST_DIR = join(process.cwd(), 'dist');

async function findFiles(dir, extensions, files = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await findFiles(fullPath, extensions, files);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Ignore permission errors
    if (error.code !== 'EACCES') {
      throw error;
    }
  }
  
  return files;
}

async function verifyBuild() {
  console.log('🔍 Verifying production build...\n');
  
  // ✅ Check 1: dist folder exists
  if (!existsSync(DIST_DIR)) {
    console.error('❌ ERROR: dist folder does not exist!');
    console.error('   Run "npm run build" first.');
    process.exit(1);
  }
  console.log('✅ dist folder exists');
  
  // ✅ Check 2: No raw JSX/TSX files in dist
  const jsxFiles = await findFiles(DIST_DIR, ['.jsx', '.tsx']);
  if (jsxFiles.length > 0) {
    console.error('❌ CRITICAL ERROR: Found raw JSX/TSX files in dist folder!');
    console.error('   These files will cause "MIME type of text/jsx" errors in production.');
    console.error('   Files found:');
    jsxFiles.forEach(file => {
      console.error(`   - ${file.replace(process.cwd() + '/', '')}`);
    });
    console.error('\n   This usually means:');
    console.error('   1. Build process failed or was incomplete');
    console.error('   2. Vite config is misconfigured');
    console.error('   3. Source files were copied instead of compiled');
    process.exit(1);
  }
  console.log('✅ No raw JSX/TSX files found (correct)');
  
  // ✅ Check 3: Compiled JS files exist
  const jsFiles = await findFiles(DIST_DIR, ['.js', '.mjs']);
  if (jsFiles.length === 0) {
    console.error('❌ ERROR: No JavaScript files found in dist!');
    console.error('   Build may have failed or produced no output.');
    process.exit(1);
  }
  console.log(`✅ Found ${jsFiles.length} compiled JavaScript file(s)`);
  
  // ✅ Check 4: index.html exists
  const indexPath = join(DIST_DIR, 'index.html');
  if (!existsSync(indexPath)) {
    console.error('❌ ERROR: dist/index.html not found!');
    process.exit(1);
  }
  console.log('✅ dist/index.html exists');
  
  // ✅ Check 5: index.html doesn't reference JSX files
  try {
    const indexContent = await readFile(indexPath, 'utf-8');
    if (indexContent.includes('.jsx') || indexContent.includes('.tsx')) {
      console.error('❌ ERROR: index.html references .jsx/.tsx files!');
      console.error('   Should only reference compiled .js files.');
      console.error('   This indicates the build process did not complete correctly.');
      process.exit(1);
    }
    console.log('✅ index.html only references compiled .js files');
  } catch (error) {
    console.error('❌ ERROR: Could not read index.html:', error.message);
    process.exit(1);
  }
  
  // ✅ Check 6: Verify manifest.json exists (for PWA)
  const manifestPath = join(DIST_DIR, 'manifest.json');
  if (existsSync(manifestPath)) {
    console.log('✅ manifest.json exists (PWA ready)');
  } else {
    console.warn('⚠️  WARNING: manifest.json not found (PWA may not work)');
  }
  
  // ✅ Check 7: Verify service worker exists (for PWA)
  const swFiles = await findFiles(DIST_DIR, ['.js']);
  const hasServiceWorker = swFiles.some(file => 
    file.includes('sw.js') || file.includes('service-worker') || file.includes('workbox')
  );
  if (hasServiceWorker) {
    console.log('✅ Service worker found (PWA ready)');
  } else {
    console.warn('⚠️  WARNING: Service worker not found (PWA may not work)');
  }
  
  console.log('\n✅ Build verification complete - safe to deploy!');
  console.log('   All checks passed. Production build is ready.');
}

// Run verification
verifyBuild().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
