import fs from 'node:fs';
import path from 'node:path';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';


const packageJson = JSON.parse(
	fs.readFileSync(path.resolve('package.json'), 'utf8')
);


export default defineConfig({
	plugins: [
		sveltekit({
			version: {
				name: packageJson.version
			},
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	]
});
