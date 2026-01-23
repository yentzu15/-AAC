import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // 引入 PWA 套件

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // 🔥 設定 PWA 功能
        VitePWA({
          registerType: 'autoUpdate', // 自動更新
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: '高高老師語你在一起', // APP 全名
            short_name: '高高老師AAC',     // 手機桌面顯示的短名稱
            description: 'AI 輔助溝通系統',
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',    // 設定為全螢幕 (像原生 APP)
            icons: [
              {
                src: '/icons/logo.png', // 使用你原本的 Logo
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: '/icons/logo.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
