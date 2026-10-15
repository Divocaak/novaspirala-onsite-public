import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	DB_HOST: {
		schema: (value) => value
	},
	DB_PORT: {
		schema: (value) => Number(value)
	},
	DB_USER: {
		schema: (value) => value
	},
	DB_PASSWORD: {
		schema: (value) => value
	},
	DB_NAME: {
		schema: (value) => value
	},
	DB_SOCKET: {
		schema: (value) => value || undefined
	},
	PUBLIC_SUBTITLES_URL: {
		schema: (value) => value,
		public: true
	},
	PUBLIC_SUBTITLES_WS_URL: {
		schema: (value) => value,
		public: true
	}
});
