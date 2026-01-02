import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      // Force Logo to be pre-bundled and always available
      './src/components/Logo.jsx'
    ]
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
        description: 'Secure student messaging platform with AI-powered content moderation',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        id: '/',
        categories: ['education', 'social', 'communication'],
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
        // Force cache invalidation on update - use timestamp to ensure unique cache per build
        cacheId: `campusconnect-${Date.now()}`,
        runtimeCaching: [
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
        navigateFallbackDenylist: [/^\/api/, /^\/_/, /^\/admin/]
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
      output: {
        manualChunks: (id) => {
          // CRITICAL: Core modules MUST be in main entry bundle, not split
          // These are imported by lazy components and must be available synchronously
          const lowerId = id.toLowerCase();
          
          // Firebase config - MUST be in main bundle (lazy components import auth, db, etc.)
          // Check with multiple variations to catch all cases
          if (
            lowerId.includes('firebaseconfig') ||
            id.includes('firebaseConfig') ||
            id.includes('firebaseConfig.js') ||
            id.includes('src/firebaseConfig') ||
            id.includes('src\\firebaseConfig') ||
            id.endsWith('firebaseConfig.js') ||
            (id.includes('firebase') && id.includes('Config') && !id.includes('node_modules'))
          ) {
            return undefined; // Force into main entry - never split
          }
          
          // Logo and logoRegistry - MUST be in main bundle
          if (
            lowerId.includes('logoregistry') ||
            id.includes('logoRegistry') ||
            id.includes('utils/logoRegistry') ||
            id.includes('utils\\logoRegistry') ||
            id.includes('logoRegistry.js') ||
            id.endsWith('logoRegistry.js') ||
            id.includes('src/utils/logoRegistry') ||
            id.includes('src\\utils\\logoRegistry')
          ) {
            return undefined; // Force into main entry - never split
          }
          
          // Check for Logo component
          if (
            id.includes('Logo.jsx') || 
            id.includes('Logo.tsx') || 
            id.includes('components/Logo') ||
            id.includes('components\\Logo') ||
            (id.includes('Logo') && !id.includes('node_modules'))
          ) {
            return undefined; // Force into main entry - never split
          }
          
          // ALL utility modules - MUST be in main bundle (lazy components import from utils/)
          // This prevents ALL export errors at once instead of fixing them one by one
          const utilsModules = [
            'errorhandler', 'helpers', 'sanitize', 'validation', 'drafts', 
            'export', 'savemessage', 'markdown', 'notifications', 'toxicitychecker',
            'debounce', 'accessibility', 'virtualscroll', 'animations', 'usagelimiter'
          ];
          
          for (const utilModule of utilsModules) {
            if (
              lowerId.includes(utilModule) ||
              id.includes(`utils/${utilModule}`) ||
              id.includes(`utils\\${utilModule}`) ||
              id.endsWith(`${utilModule}.js`) ||
              id.includes(`src/utils/${utilModule}`)
            ) {
              return undefined; // Force into main entry - never split
            }
          }
          
          // ALL context modules - MUST be in main bundle (lazy components import hooks from context/)
          // Context providers are used by ALL lazy components and must be available synchronously
          // CRITICAL: Catch ANY file in src/context/ directory - be extremely aggressive
          if (
            !id.includes('node_modules') &&
            (
              (id.includes('context/') || id.includes('context\\')) &&
              (id.includes('AuthContext') ||
               id.includes('ThemeContext') ||
               id.includes('ToastContext') ||
               id.includes('PresenceContext') ||
               id.includes('PreferencesContext') ||
               id.includes('CallContext') ||
               lowerId.includes('authcontext') ||
               lowerId.includes('themecontext') ||
               lowerId.includes('toastcontext') ||
               lowerId.includes('presencecontext') ||
               lowerId.includes('preferencescontext') ||
               lowerId.includes('callcontext'))
            )
          ) {
            return undefined; // Force into main entry - never split
          }
          
          // Also catch any shared chunks that might contain context exports
          // If a chunk would contain context-related code, force it into main bundle
          if (lowerId.includes('context') && !id.includes('node_modules')) {
            return undefined; // Force into main entry - never split
          }
          
          // CRITICAL: Prevent ANY small index-* chunks from being created
          // These are often shared chunks that cause export errors
          // If we see a chunk that would be named "index-*" and it's not the main entry,
          // check if it contains any of our critical modules and force into main
          // Note: The main entry is handled separately, so any other "index" chunk is suspicious
          
          // Split vendor chunks more aggressively for better PWA performance
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
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
            // Other node_modules
            return 'vendor';
          }
          
          // CRITICAL: If we reach here and it's a source file (not node_modules),
          // and it's not already handled above, check if it's imported by multiple lazy components
          // If so, force it into main bundle to prevent shared chunk creation
          if (!id.includes('node_modules') && id.includes('src/')) {
            // Check if it's a context, utility, or component that lazy components might share
            if (
              id.includes('context/') ||
              id.includes('utils/') ||
              id.includes('components/') && (
                id.includes('Logo') ||
                id.includes('SkeletonLoader') ||
                id.includes('TypingIndicator') ||
                id.includes('ImagePreview') ||
                id.includes('EmojiPicker') ||
                id.includes('MentionAutocomplete') ||
                id.includes('AdvancedSearch') ||
                id.includes('UserProfilePopup') ||
                id.includes('FileUpload')
              )
            ) {
              return undefined; // Force into main entry - prevent shared chunks
            }
          }
        },
        // Ensure chunk names are stable
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    chunkSizeWarningLimit: 600,
    // Disable source maps for production to reduce bundle size
    sourcemap: false,
    // Minify more aggressively
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console.error and console.warn for mobile debugging
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'] // Only remove non-critical logs
      }
    }
  }
})

