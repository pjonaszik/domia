import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { formatAddressForGeocoding, geocodeAddressWithNominatim } from '@/lib/server/geocoding';

function parseOptionalRate(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;

    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (!Number.isFinite(num) || num < 0) {
        throw new Error('Invalid hourly rate. Must be a positive number.');
    }

    // Keep scale=2 expectation (db is decimal scale 2); store as string to match schema usage.
    return num.toFixed(2);
}

export async function updateUserHourlyRate(userId: string, hourlyRate: unknown) {
    const rate = parseOptionalRate(hourlyRate);

    const [updatedUser] = await db
        .update(users)
        .set({
            hourlyRate: rate,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
}

export async function updateUserProfile(
    userId: string,
    data: {
        hourlyRate?: unknown;
        address?: unknown;
        city?: unknown;
        postalCode?: unknown;
        country?: unknown;
        language?: string | null;
    }
) {
    const [existing] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!existing) {
        throw new Error('User not found');
    }

    const update: Record<string, any> = { updatedAt: new Date() };

    if ('hourlyRate' in data) {
        update.hourlyRate = parseOptionalRate(data.hourlyRate);
    }

    const nextAddress = data.address !== undefined ? String(data.address || '').trim() || null : existing.address;
    const nextCity = data.city !== undefined ? String(data.city || '').trim() || null : existing.city;
    const nextPostalCode = data.postalCode !== undefined ? String(data.postalCode || '').trim() || null : existing.postalCode;
    const nextCountry = data.country !== undefined ? String(data.country || '').trim() || null : existing.country;

    const addressTouched =
        data.address !== undefined || data.city !== undefined || data.postalCode !== undefined || data.country !== undefined;

    if (addressTouched) {
        update.address = nextAddress;
        update.city = nextCity;
        update.postalCode = nextPostalCode;
        update.country = nextCountry;

        // Re-geocode only if we have enough info
        const hasEnough = Boolean(nextAddress && nextCity && nextPostalCode);
        if (hasEnough) {
            const geocodeQuery = formatAddressForGeocoding({
                address: nextAddress,
                postalCode: nextPostalCode,
                city: nextCity,
                country: nextCountry || 'France',
            });
            const coords = await geocodeAddressWithNominatim({
                address: geocodeQuery,
                language: data.language || 'fr',
                country: nextCountry || 'France',
            });
            update.latitude = coords ? coords.lat.toString() : null;
            update.longitude = coords ? coords.lon.toString() : null;
        } else {
            update.latitude = null;
            update.longitude = null;
        }
    }

    const [updatedUser] = await db.update(users).set(update).where(eq(users.id, userId)).returning();
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
}


