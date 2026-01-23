import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { readdirSync, renameSync, statSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      // Pre-bundle animation libraries to prevent circular dependency issues
      'framer-motion',
      '@react-spring/web',
      'gsap',
      // Force Logo to be pre-bundled and always available
      './src/components/Logo.jsx'
    ],
    // Ensure React is always available synchronously
    esbuildOptions: {
      jsx: 'automatic',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment'
    },
    // Force React to be pre-bundled and not split
    force: true,
    // Exclude React from optimization to keep it in main bundle
    exclude: []
  },
  plugins: [
    react({
      // ✅ FIX: Ensure JSX is always transformed to JS in production
      // Explicitly configure JSX transformation
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      // Include all JSX files for transformation
      include: /\.(jsx|tsx|js|ts)$/,
      // Force transformation
      babel: {
        plugins: []
      }
    }),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.png', 'favicon.ico', 'browserconfig.xml'],
      injectManifest: false,
      manifest: {
        name: 'CampusConnect - Student Messaging Platform',
        short_name: 'CampusConnect',
        description: 'Secure student messaging platform with AI-powered content moderation, real-time chat, group messaging, and intelligent AI assistant',
        theme_color: '#4f46e5',
        background_color: '#050505', // Dark background for better splash screen
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        orientation: 'any', // Support both portrait and landscape
        scope: '/',
        start_url: '/',
        id: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['education', 'social', 'communication'],
        edge_side_panel: {
          preferred_width: 400
        },
        share_target: {
          action: '/',
          method: 'GET',
          enctype: 'application/x-www-form-urlencoded',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        file_handlers: [
          {
            action: '/',
            accept: {
              'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
              'text/*': ['.txt', '.md'],
              'application/pdf': ['.pdf']
            }
          }
        ],
        protocol_handlers: [
          {
            protocol: 'web+campusconnect',
            url: '/?url=%s'
          }
        ],
        icons: [
          {
            src: '/logo.png',
            sizes: '48x48',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '167x167',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo.png',
            sizes: '256x256',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'Campus Chat',
            short_name: 'Chat',
            description: 'Open Campus Chat',
            url: '/?view=campus',
            icons: [{ src: '/logo.png', sizes: '192x192' }]
          },
          {
            name: 'Direct Messages',
            short_name: 'Messages',
            description: 'Open Direct Messages',
            url: '/?view=messages',
            icons: [{ src: '/logo.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,webp,json}'],
        maximumFileSizeToCacheInBytes: 5000000, // 5 MB - optimized for mobile
        cleanupOutdatedCaches: true,
        skipWaiting: true, // Immediately activate new service worker
        clientsClaim: true, // Take control of all clients immediately
        // Optimize for mobile networks
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /^\/_/, /\.(?:js|mjs|css)$/, /^\/firebase/],
        // Better offline support for mobile
        offlineGoogleAnalytics: false,
        // Optimize cache for mobile devices with versioning
        cacheId: 'campusconnect-v8.3.0',
        runtimeCaching: [
          {
            // CRITICAL: Handle JS module requests BEFORE navigateFallback
            // This prevents "Expected a JavaScript module but got text/html" errors
            // When a JS file is missing (old hash), NetworkFirst will fail and return 404 instead of HTML
            urlPattern: /\.(?:js|mjs)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'js-modules-cache-v1',
              expiration: {
                maxEntries: 50, // Reduced for mobile
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days - immutable files with hash
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.css$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'css-cache-v1',
              expiration: {
                maxEntries: 30, // Reduced for mobile
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.firebaseapp\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firebase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.firebasestorage\.app\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache-v1',
              expiration: {
                maxEntries: 200, // Increased for images/files
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days - images rarely change
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              // Match requests for images
              matchOptions: {
                ignoreSearch: false,
                ignoreVary: true
              }
            }
          },
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache-v1',
              expiration: {
                maxEntries: 100, // Increased for better image caching
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              // Optimize for images
              matchOptions: {
                ignoreSearch: false,
                ignoreVary: true
              }
            }
          },
          {
            // API calls - NetworkFirst with short cache
            urlPattern: /^https:\/\/.*\.googleapis\.com\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache-v1',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 5 // 5 minutes - short cache for API
              },
              cacheableResponse: {
                statuses: [0, 200]
              },
              networkTimeoutSeconds: 10 // Timeout after 10s
            }
          },
          {
            // HTML pages - NetworkFirst with fallback
            urlPattern: /\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache-v1',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-apis-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ],
        navigationPreload: false // Disabled to prevent preloadResponse cancellation errors
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: '/index.html'
      },
      injectRegister: 'auto',
      strategies: 'generateSW',
      // Better update handling
      selfDestroying: false,
      // Optimize install prompt
      includeManifestIcons: true,
      // Better compression
      minify: true
    }),
    // ✅ FIX: Custom plugin to rename .jsx files to .js after build
    {
      name: 'fix-jsx-extensions',
      writeBundle() {
        const distDir = join(process.cwd(), 'dist');
        
        function fixJSXFiles(dir) {
          try {
            const entries = readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              const fullPath = join(dir, entry.name);
              if (entry.isDirectory()) {
                fixJSXFiles(fullPath);
              } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.tsx'))) {
                const newName = entry.name.replace(/\.(jsx|tsx)$/, '.js');
                const newPath = join(dir, newName);
                console.log(`[fix-jsx-extensions] Renaming ${entry.name} to ${newName}`);
                renameSync(fullPath, newPath);
                
                // Also update index.html if it references the old file
                const indexPath = join(distDir, 'index.html');
                try {
                  if (statSync(indexPath).isFile()) {
                    const indexContent = readFileSync(indexPath, 'utf-8');
                    if (indexContent.includes(entry.name)) {
                      const updatedContent = indexContent.replace(
                        new RegExp(entry.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), 
                        newName
                      );
                      writeFileSync(indexPath, updatedContent, 'utf-8');
                      console.log(`[fix-jsx-extensions] Updated index.html to reference ${newName}`);
                    }
                  }
                } catch (err) {
                  // Ignore errors updating index.html
                }
              }
            }
          } catch (error) {
            if (error.code !== 'EACCES') {
              console.error('[fix-jsx-extensions] Error:', error);
            }
          }
        }
        fixJSXFiles(distDir);
      }
    }
  ],
  build: {
    // Optimize build output for PWA
    target: 'es2020', // Modern target for better performance
    cssCodeSplit: true, // Split CSS for better caching
    minify: 'terser', // Use terser for better minification
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'] // Remove specific console methods
      }
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 500, // Lower warning threshold
    // Report compressed sizes
    reportCompressedSize: true,
    rollupOptions: {
      // Preserve entry signatures to ensure React is in main bundle
      preserveEntrySignatures: 'strict',
      // Better tree shaking
      treeshake: {
        preset: 'smallest',
        moduleSideEffects: false,
        propertyReadSideEffects: false
      },
      output: {
        manualChunks: (id) => {
          // CRITICAL: Keep React and React-DOM in main bundle to prevent "createContext" errors
          // React must be available synchronously when contexts are created
          
          // If it's a source file, put it in main bundle (no code-splitting)
          if (!id.includes('node_modules') && id.includes('src/')) {
            return undefined; // Main bundle - no splitting
          }
          
          // Keep React and React-DOM in main bundle (CRITICAL for contexts)
          if (id.includes('node_modules')) {
            // DO NOT split React/React-DOM - they must be in main bundle
            // Check for exact React packages (more comprehensive check)
            const isReact = 
              id.includes('node_modules/react/') ||
              id.includes('node_modules\\react\\') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules\\react-dom\\') ||
              id.includes('react/jsx-runtime') ||
              id.includes('react/jsx-dev-runtime') ||
              id.includes('react/index') ||
              id.includes('react-dom/index') ||
              (id.includes('react') && !id.includes('react-') && id.endsWith('.js')) ||
              (id.includes('react-dom') && !id.includes('react-dom-') && id.endsWith('.js'));
            
            if (isReact) {
              return undefined; // Main bundle - React must be available immediately
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('zego-express-engine')) {
              return 'zego-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'ui-vendor';
            }
            if (id.includes('@google/generative-ai')) {
              return 'gemini-vendor';
            }
            // Keep animation libraries in main vendor chunk to avoid circular dependency issues
            // Moving framer-motion, react-spring, and gsap to vendor instead of separate chunk
            // This prevents "Cannot access 'yf' before initialization" errors
            if (id.includes('framer-motion') || id.includes('@react-spring') || id.includes('gsap')) {
              return 'vendor'; // Put in main vendor chunk instead of separate animation-vendor
            }
            // Other node_modules
            return 'vendor';
          }
          
          // Everything else goes to main bundle
          return undefined;
        },
        // ✅ FIX: Ensure chunk names are stable and ALWAYS use .js extension
        // Use functions to explicitly force .js extension (string patterns don't override source extension)
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name || 'chunk';
          const hash = chunkInfo.hash || '';
          // Force .js extension regardless of source file extension
          return `assets/${name}-${hash}.js`;
        },
        entryFileNames: (chunkInfo) => {
          const name = chunkInfo.name || 'main';
          const hash = chunkInfo.hash || '';
          // Force .js extension regardless of source file extension (main.jsx -> main.js)
          return `assets/${name}-${hash}.js`;
        },
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: false, // Disable sourcemaps for production to reduce build size
    // Optimize assets
    assetsInlineLimit: 4096 // Inline assets smaller than 4kb
  },
  chunkSizeWarningLimit: 600
})
