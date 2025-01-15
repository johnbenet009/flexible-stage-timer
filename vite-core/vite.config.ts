import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
      middleware: (req, res, next) => {
        const url = req.url;
        if (url.startsWith('/')) {
            const indexPath = path.join(__dirname, 'index.html')
            res.sendFile(indexPath);
        } else {
            next();
        }
    },
  },
    optimizeDeps: {
        exclude: ['lucide-react'],
    },
});