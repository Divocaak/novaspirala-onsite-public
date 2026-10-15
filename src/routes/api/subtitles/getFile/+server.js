
import { json, text } from '@sveltejs/kit';
import { PUBLIC_SUBTITLES_URL } from '$app/env/public';

const SUPPORTED_LANGUAGES = ['cs', 'en', 'de', 'sk', 'pl', 'fr', 'es'];

export async function GET({ url, fetch }) {
    const folder = url.searchParams.get('folder');
    const language = url.searchParams.get('lang');

    if (
        !folder ||
        !/^[a-zA-Z0-9_-]+$/.test(folder) ||
        !SUPPORTED_LANGUAGES.includes(language)
    ) {
        return json({ error: 'Invalid subtitle folder or language.' }, { status: 400 });
    }

    const baseUrl = PUBLIC_SUBTITLES_URL?.replace(/\/+$/, '');

    if (!baseUrl) {
        return json({ error: 'SUBTITLES_URL is not configured.' }, { status: 500 });
    }

    const fileUrl =
        `${baseUrl}/${encodeURIComponent(folder)}/${encodeURIComponent(language)}.txt`;

    try {
        const response = await fetch(fileUrl, {
            signal: AbortSignal.timeout(10000)
        });

        if (!response.ok) {
            return json(
                { error: 'Subtitle file not found.' },
                { status: response.status === 404 ? 404 : 502 }
            );
        }

        const content = await response.text();

        return text(content, {
            headers: {
                'Cache-Control': 'no-store',
                'Content-Type': 'text/plain; charset=utf-8'
            }
        });
    } catch (error) {
        console.error('Could not fetch subtitle file:', error);

        return json({ error: 'Could not fetch subtitle file.' }, { status: 502 });
    }
}
