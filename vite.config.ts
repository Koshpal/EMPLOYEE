import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  // A production bundle must never silently talk to localhost (or to nothing).
  // Set VITE_API_URL in the hosting environment (e.g. Vercel project settings).
  if (command === 'build' && mode === 'production' && !process.env.ALLOW_LOCAL_API_BUILD) {
    const apiUrl = loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL
    if (!apiUrl) throw new Error('VITE_API_URL is not set: a production build would have no API to call.')
    if (/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])/i.test(apiUrl)) {
      throw new Error(
        `VITE_API_URL points at ${apiUrl}. Refusing to build a production bundle against a local API ` +
        '(a .env.local file can cause this). Set ALLOW_LOCAL_API_BUILD=1 to build for a local preview on purpose.',
      )
    }
  }
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
  }
})
