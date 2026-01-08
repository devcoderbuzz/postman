import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({

  plugins: [
    react(), 
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon.svg', 'maskable-icon.svg', 'vite.svg'],
      manifest: {
        name: 'Postman Studio',
        short_name: 'PostmanStudio',
        description: 'A Curved Postman-like API client',
        theme_color: '#ef4444',
        background_color: '#ef4444',
        icons: [
          {
            src: 'app-icon.svg?v=6',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'maskable-icon.svg?v=6',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
})
