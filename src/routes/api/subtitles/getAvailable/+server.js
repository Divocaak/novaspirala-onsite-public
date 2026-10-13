
import { json } from '@sveltejs/kit';
import { env } from '$app/env/private';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const languagePattern = /^[a-z]{2,3}$/;

export async function GET({ url }) {
    const folder = url.searchParams.get('folder');
    const language = url.searchParams.get('lang');

    if (
        !folder ||
        !/^[a-zA-Z0-9_-]+$/.test(folder) ||
        !language ||
        !languagePattern.test(language)
    ) return json({ error: 'Invalid folder or language.' }, { status: 400 });

    const root = path.resolve(env.SUBTITLES_ROOT);
    const directory = path.resolve(root, folder);

    if (!directory.startsWith(root + path.sep)) return json({ error: 'Invalid folder.' }, { status: 400 });

    try {
        const files = await readdir(directory);

        const languages = files
            .filter(file => /^[a-z]{2,3}\.txt$/.test(file))
            .map(file => file.slice(0, -4))
            .sort();

        if (!languages.includes(language)) return json({ error: 'Language not available.' }, { status: 404 });

        const filePath = path.join(directory, `${language}.txt`);
        const content = await readFile(filePath, 'utf8');

        return json({
            language,
            languages,
            lines: content.split(/\r?\n/)
        });
    } catch (error) {
        if (error.code === 'ENOENT') return json({ error: 'Subtitle folder not found.' }, { status: 404 });
        console.error('Failed to load subtitles:', error);
        return json({ error: 'Failed to load subtitles.' }, { status: 500 });
    }
}
