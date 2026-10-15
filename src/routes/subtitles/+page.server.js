import { pool } from '#lib/db/mysql.js';
import { redirect } from '@sveltejs/kit';

export async function load({ cookies, url }) {
    const venueId = Number(cookies.get('venue_id'));

    if (!Number.isInteger(venueId) || venueId <= 0) throw redirect(303, '/');

    const browserNow = url.searchParams.get('now');

    // Accept YYYY-MM-DD HH:mm:ss
    const isValidDateTime =
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(browserNow ?? '');
    const now = isValidDateTime ? browserNow : null;

    const [rows] = await pool.query(
        `SELECT
            e.id,
            e.label,
            e.subtitles_name,
            e.text_color,
            e.background_color,
            v.label AS venue_label
        FROM event e
        JOIN venue v ON v.id = e.id_venue
        WHERE
            e.id_venue = ?
            AND e.active = 1
            AND e.date_from <= COALESCE(?, NOW())
            AND e.date_to >= COALESCE(?, NOW())
        ORDER BY e.date_from DESC
        LIMIT 1`,
        [venueId, now, now]
    );

    return {
        venueLabel: cookies.get('venue_label') ?? null,
        event: rows[0] ?? null
    };
}