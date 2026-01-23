#!/usr/bin/env node
/**
 * Fix JSX Extensions Script
 * Renames any .jsx files in dist to .js (should never happen, but safety net)
 */

import { readdir, stat, rename } from 'fs/promises';
import { join, extname } from 'path';
import { existsSync } from 'fs';

const DIST_DIR = join(process.cwd(), 'dist');

async function findAndFixJSXFiles(dir) {
  let fixedCount = 0;
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      
      if (entry.isDirectory()) {
        fixedCount += await findAndFixJSXFiles(fullPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (ext === '.jsx' || ext === '.tsx') {
          // Rename .jsx/.tsx to .js
          const newName = entry.name.replace(/\.(jsx|tsx)$/, '.js');
          const newPath = join(dir, newName);
          
          console.log(`⚠️  WARNING: Found ${ext} file in dist: ${fullPath.replace(process.cwd() + '/', '')}`);
          console.log(`   Renaming to: ${newPath.replace(process.cwd() + '/', '')}`);
          
          await rename(fullPath, newPath);
          fixedCount++;
        }
      }
    }
  } catch (error) {
    if (error.code !== 'EACCES') {
      throw error;
    }
  }
  
  return fixedCount;
}

async function fixJSXExtensions() {
  console.log('🔧 Checking for JSX files in dist folder...\n');
  
  if (!existsSync(DIST_DIR)) {
    console.log('⚠️  dist folder does not exist. Run "npm run build" first.');
    return;
  }
  
  const fixedCount = await findAndFixJSXFiles(DIST_DIR);
  
  if (fixedCount > 0) {
    console.log(`\n✅ Fixed ${fixedCount} JSX/TSX file(s) by renaming to .js`);
    console.log('⚠️  This should not happen - Vite should transform JSX to JS during build.');
    console.log('   Please check your vite.config.js and ensure React plugin is configured correctly.');
  } else {
    console.log('✅ No JSX/TSX files found in dist (correct)');
  }
}

// Run fix
fixJSXExtensions().catch(error => {
  console.error('❌ Error fixing JSX extensions:', error);
  process.exit(1);
});
