import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import glsl from 'vite-plugin-glsl'

const external = [
  'react',
  'react-dom',
  'three',
  '@react-three/fiber',
  '@react-three/drei',
]

// for library mode
const build = {
  lib: {
    entry: 'src/index.ts',
    formats: ['es'],
  },
  rollupOptions: {
    external,
  },
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    glsl(),
    {
      name: 'server-console-log',
      configureServer(server) {
        server.ws.on('log', (data, client) => {
          console.log(data)
        })
        server.ws.on('log:error', (data, client) => {
          console.error(data)
        })
      },
    },
  ],
})
