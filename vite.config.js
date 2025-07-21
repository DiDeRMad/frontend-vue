import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }],
          ['@babel/plugin-proposal-class-properties', { loose: true }]
        ]
      }
    })
  ],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src/client'),
      '@components': resolve(__dirname, './src/client/components'),
      '@pages': resolve(__dirname, './src/client/pages'),
      '@services': resolve(__dirname, './src/client/services'),
      '@utils': resolve(__dirname, './src/client/utils'),
      '@hooks': resolve(__dirname, './src/client/hooks'),
      '@contexts': resolve(__dirname, './src/client/contexts'),
      '@store': resolve(__dirname, './src/client/store'),
      '@assets': resolve(__dirname, './src/client/assets'),
      '@game': resolve(__dirname, './src/client/game'),
      '@shared': resolve(__dirname, './src/shared')
    }
  },
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  },
  
  build: {
    outDir: 'dist/client',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV !== 'production',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production'
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'game-engine': ['three', 'phaser'],
          'ui-vendor': ['framer-motion', 'react-spring', '@dnd-kit/core', '@dnd-kit/sortable'],
          'state-management': ['@reduxjs/toolkit', 'react-redux', 'zustand', 'mobx', 'mobx-react-lite'],
          'network': ['socket.io-client', 'axios'],
          'utils': ['lodash', 'dayjs', 'uuid', 'classnames']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'three',
      'phaser',
      'socket.io-client',
      '@reduxjs/toolkit',
      'framer-motion'
    ],
    exclude: ['@mediapipe/pose', '@mediapipe/face_mesh', '@mediapipe/hands']
  },
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000'),
    'process.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL || 'ws://localhost:3000'),
    'process.env.VITE_ASSET_URL': JSON.stringify(process.env.VITE_ASSET_URL || ''),
    'process.env.VITE_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
