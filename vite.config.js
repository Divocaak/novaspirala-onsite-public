import adapter from '@sveltejs/adapter-node';

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';

import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules')
						? undefined
						: true
			},

			adapter: adapter(),

			version: {
				name: pkg.version
			}
		})
	]
});