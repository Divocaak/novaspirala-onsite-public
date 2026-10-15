
export function load({ cookies }) {
    return {
        venueLabel: cookies.get('venue_label') ?? null,
        hasVenue: Boolean(cookies.get('venue_id'))
    };
}
