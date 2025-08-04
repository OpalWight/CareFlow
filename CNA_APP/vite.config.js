import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')
  
  console.log('🔍 VITE CONFIG DIAGNOSTICS:')
  console.log('  - Command:', command)
  console.log('  - Mode:', mode)
  console.log('  - NODE_ENV:', process.env.NODE_ENV)
  console.log('  - Working Directory:', process.cwd())
  console.log('  - Loaded VITE_ vars:', Object.keys(env).filter(key => key.startsWith('VITE_')))
  
  // Log VITE environment variables
  Object.keys(env).filter(key => key.startsWith('VITE_')).forEach(key => {
    console.log(`    ${key}:`, env[key])
  })

  return {
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    // Explicitly expose environment variables to ensure they're available
    define: {
      __VITE_API_URL__: JSON.stringify(env.VITE_API_URL),
      __VITE_ENV__: JSON.stringify(env.VITE_ENV),
      __BUILD_MODE__: JSON.stringify(mode),
      __BUILD_COMMAND__: JSON.stringify(command)
    }
  }
})