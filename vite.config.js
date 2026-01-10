import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.png', 'favicon.ico'],
      injectManifest: false,
      manifest: {
        name: 'CampusConnect - Student Messaging Platform',
        short_name: 'CampusConnect',
        description: 'Secure student messaging platform with AI-powered content moderation, real-time chat, group messaging, and intelligent AI assistant',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any', // Support both portrait and landscape
        scope: '/',
        start_url: '/',
        id: '/',
        categories: ['education', 'social', 'communication'],
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
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}'],
        maximumFileSizeToCacheInBytes: 5000000, // 5 MB - increased to accommodate ZEGOCLOUD SDK (2.16 MB)
        cleanupOutdatedCaches: true,
        skipWaiting: true, // Immediately activate new service worker
        clientsClaim: true, // Take control of all clients immediately
        runtimeCaching: [
          {
            // CRITICAL: Handle JS module requests BEFORE navigateFallback
            // This prevents "Expected a JavaScript module but got text/html" errors
            // When a JS file is missing (old hash), NetworkFirst will fail and return 404 instead of HTML
            urlPattern: /\.(?:js|mjs)$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'js-modules-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day - immutable files with hash in name
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.css$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'css-cache',
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
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
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
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
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
        navigationPreload: false, // Disabled to prevent preloadResponse cancellation errors
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api/,
          /^\/_/,
          /^\/admin/,
          /\.js$/,
          /\.mjs$/,
          /\.css$/,
          /\/assets\//
        ],
        // Exclude JS, CSS, and assets from being served as HTML
        // This prevents "Expected a JavaScript module but got text/html" errors
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      },
      injectRegister: 'auto',
      strategies: 'generateSW'
    })
  ],
  build: {
    // Optimize build output for PWA
    target: 'es2015', // Better compatibility with service workers
    cssCodeSplit: true, // Split CSS for better caching
    rollupOptions: {
      // Preserve entry signatures to ensure React is in main bundle
      preserveEntrySignatures: 'strict',
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
        // Ensure chunk names are stable
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    sourcemap: false // Disable sourcemaps for production to reduce build size
  },
  chunkSizeWarningLimit: 600
})
