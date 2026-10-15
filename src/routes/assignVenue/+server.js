
import { redirect } from '@sveltejs/kit';
import { pool } from '#lib/db/mysql.js';

export async function GET({ url, cookies }) {
    const venueId = Number(url.searchParams.get('vid'));

    if (!Number.isInteger(venueId) || venueId <= 0) throw redirect(303, '/');

    const [rows] = await pool.query(
        'SELECT id, label FROM venue WHERE id = ? LIMIT 1',
        [venueId]
    );

    if (rows.length === 0) throw redirect(303, '/');

    const venue = rows[0];
    const cookieOptions = {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30
    };
    cookies.set('venue_id', String(venue.id), cookieOptions);
    cookies.set('venue_label', venue.label, cookieOptions);

    throw redirect(303, '/subtitles');
}
