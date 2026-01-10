type GeocodeResult = { lat: number; lon: number };

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

// Very small in-process rate limit to respect Nominatim usage (best effort).
let lastNominatimCallAtMs = 0;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizePart(value: unknown): string {
    return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function formatAddressForGeocoding(params: {
    address?: string | null;
    postalCode?: string | null;
    city?: string | null;
    country?: string | null;
}) {
    const address = normalizePart(params.address);
    const postalCode = normalizePart(params.postalCode);
    const city = normalizePart(params.city);
    const country = normalizePart(params.country || 'France');

    const parts = [address, [postalCode, city].filter(Boolean).join(' '), country].filter(Boolean);
    return parts.join(', ');
}

function guessCountryCode(country: string): string | null {
    const c = normalizePart(country).toLowerCase();
    if (!c) return null;
    if (c.includes('france')) return 'fr';
    if (c.includes('espagne') || c.includes('spain')) return 'es';
    if (c.includes('belgique') || c.includes('belgium')) return 'be';
    if (c.includes('suisse') || c.includes('switzerland')) return 'ch';
    if (c.includes('luxembourg')) return 'lu';
    return null;
}

export async function geocodeAddressWithNominatim(params: {
    address: string;
    language?: string | null;
    country?: string | null;
    timeoutMs?: number;
}): Promise<GeocodeResult | null> {
    const address = normalizePart(params.address);
    if (!address) return null;

    // Best-effort global (per-process) rate limit ~1 req/sec
    const now = Date.now();
    const delta = now - lastNominatimCallAtMs;
    if (delta < 1100) {
        await sleep(1100 - delta);
    }
    lastNominatimCallAtMs = Date.now();

    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.set('q', address);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const countryCode = params.country ? guessCountryCode(params.country) : null;
    if (countryCode) {
        url.searchParams.set('countrycodes', countryCode);
    }

    const userAgent =
        process.env.NOMINATIM_USER_AGENT ||
        process.env.NEXT_PUBLIC_NOMINATIM_USER_AGENT ||
        'domia/1.0 (contact@domia.local)';

    const timeoutMs = params.timeoutMs ?? 8000;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'User-Agent': userAgent,
                'Accept': 'application/json',
                ...(params.language ? { 'Accept-Language': params.language } : {}),
            },
            signal: controller.signal,
        });

        if (!res.ok) return null;

        const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
        if (!Array.isArray(data) || data.length === 0) return null;

        const lat = parseFloat(String(data[0].lat ?? ''));
        const lon = parseFloat(String(data[0].lon ?? ''));
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        return { lat, lon };
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
}


