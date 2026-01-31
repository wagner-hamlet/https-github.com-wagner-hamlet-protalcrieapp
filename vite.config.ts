import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Adicionamos isso

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // ... resto do seu código ...
        VitePWA({
          registerType: 'autoUpdate',
          strategies: 'injectManifest', // Como você já tem um sw.js, usamos isso
          srcDir: '.', 
          filename: 'sw.js',
          manifest: {
            name: 'Portal Crie App',
            short_name: 'CrieApp',
            description: 'Meu app gerado pelo AI Studio',
            theme_color: '#ffffff',
            icons: [
              {
                src: 'icon.png', // Usando o nome exato do arquivo que você subiu
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
