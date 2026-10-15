
import { json } from '@sveltejs/kit';
import { PUBLIC_SUBTITLES_URL } from '$app/env/public';
import { pool } from '#lib/db/mysql.js';

const SUPPORTED_LANGUAGES = ['cs', 'en', 'de', 'sk', 'pl', 'fr', 'es'];

function isValidDateTime(value) {
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return false;
    }

    const [datePart, timePart] = value.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes, seconds] = timePart.split(':').map(Number);

    const date = new Date(year, month - 1, day, hours, minutes, seconds);

    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day &&
        date.getHours() === hours &&
        date.getMinutes() === minutes &&
        date.getSeconds() === seconds
    );
}

async function subtitleFileExists(folder, language) {
    const baseUrl = PUBLIC_SUBTITLES_URL?.replace(/\/+$/, '');

    if (!baseUrl) {
        throw new Error('PUBLIC_SUBTITLES_URL is not configured.');
    }

    const url =
        `${baseUrl}/${encodeURIComponent(folder)}/` +
        `${encodeURIComponent(language)}.txt`;

    try {
        let response = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
        });

        // Some servers do not support HEAD. Retry with GET, but never
        // read the response body: this is only an existence check.
        if ([403, 405, 501].includes(response.status)) {
            response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });

            if (response.body) {
                await response.body.cancel().catch(() => { });
            }
        }

        return response.ok;
    } catch (error) {
        console.error(`Could not check subtitle file "${language}.txt":`, error);
        return false;
    }
}

export async function GET({ cookies, url }) {
    try {
        const venueId = Number(cookies.get('venue_id'));
        const now = url.searchParams.get('now');

        if (!Number.isInteger(venueId) || venueId <= 0) {
            return json(
                { error: 'No valid venue is assigned to this browser.' },
                { status: 400 }
            );
        }

        if (!now || !isValidDateTime(now)) {
            return json(
                { error: 'A valid local date and time are required.' },
                { status: 400 }
            );
        }

        const [events] = await pool.execute(
            `
                SELECT
                    e.id,
                    e.label,
                    e.subtitles_name,
                    v.label AS venue_label
                FROM event e
                JOIN venue v ON v.id = e.id_venue
                WHERE e.id_venue = ?
                    AND e.active = 1
                    AND e.subtitles_name IS NOT NULL
                    AND e.subtitles_name <> ''
                    AND e.date_from <= ?
                    AND e.date_to >= ?
                ORDER BY e.date_from DESC
                LIMIT 1
            `,
            [venueId, now, now]
        );

        const event = events[0];

        if (!event) {
            return json({
                event: null,
                languages: []
            });
        }

        const checks = await Promise.all(
            SUPPORTED_LANGUAGES.map(async (language) => ({
                language,
                exists: await subtitleFileExists(
                    event.subtitles_name,
                    language
                )
            }))
        );

        const languages = checks
            .filter((result) => result.exists)
            .map((result) => result.language);

        return json({
            event: languages.length > 0 ? event : null,
            languages
        });
    } catch (error) {
        console.error('Error checking available subtitles:', error);

        return json(
            { error: 'Could not check available subtitles.' },
            { status: 500 }
        );
    }
}
