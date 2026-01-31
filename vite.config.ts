import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: '.',
          filename: 'sw.js',
          registerType: 'autoUpdate',
          injectRegister: null, // Importante para não duplicar o registro do Service Worker
          manifest: {
            name: 'Portal Crie App',
            short_name: 'CrieApp',
            description: 'Meu app gerado pelo AI Studio',
            theme_color: '#0F0F0F', // Combinei com a cor do seu index.html
            background_color: '#0F0F0F',
            display: 'standalone', // Faz abrir como um app, sem barra de navegador
            icons: [
              {
                src: 'icon.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
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
