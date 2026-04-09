import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    headers: {
      // Content Security Policy
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.dicebear.com; frame-ancestors 'none';",
      // X-Content-Type-Options prevents MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      // X-Frame-Options prevents clickjacking
      'X-Frame-Options': 'DENY',
      // X-XSS-Protection enables XSS protection in older browsers
      'X-XSS-Protection': '1; mode=block',
      // Referrer-Policy controls how much referrer info is shared
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      // Permissions-Policy restricts browser features
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), payment=()',
      // HSTS (Strict-Transport-Security) enforces HTTPS
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    }
  }
})