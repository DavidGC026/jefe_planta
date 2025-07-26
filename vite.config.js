import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
	base: '/',
	plugins: [react()],
	server: {
		cors: true,
		headers: {
			'Cross-Origin-Embedder-Policy': 'credentialless',
		},
		allowedHosts: true,
		proxy: {
			'/api': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/api/, '/api')
			},
			'/jefedeplanta/api': {
				target: 'http://localhost:8080',
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path.replace(/^\/jefedeplanta\/api/, '/api')
			}
		}
	},
	resolve: {
		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
		alias: {
			'@': path.resolve(__dirname, './src'),
		},
	},
});
