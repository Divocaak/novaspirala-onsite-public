
import { pool } from '#lib/db/mysql.js';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_SUBTITLES_WS_URL } from '$app/env/public';

export async function load({ cookies }) {
    const venueId = Number(cookies.get('venue_id'));

    if (!Number.isInteger(venueId) || venueId <= 0) throw redirect(303, '/');

    const [rows] = await pool.query(
        `
            SELECT
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
                AND e.date_from <= NOW()
                AND e.date_to >= NOW()
            ORDER BY e.date_from DESC
            LIMIT 1
        `,
        [venueId]
    );

    return {
        venueLabel: cookies.get('venue_label') ?? null,
        event: rows[0] ?? null,
        wsUrl: PUBLIC_SUBTITLES_WS_URL
    };
}
