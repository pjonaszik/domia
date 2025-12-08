// /lib/utils/address-helpers.ts

/**
 * Format full address string
 */
export function formatAddress(address: string, city: string, postalCode: string, country?: string): string {
    const parts = [address, `${postalCode} ${city}`];
    if (country && country !== 'France') {
        parts.push(country);
    }
    return parts.join(', ');
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Estimate travel time in minutes
 * Assumes average speed of 30 km/h in urban areas
 */
export function estimateTravelTime(distanceKm: number, averageSpeedKmh: number = 30): number {
    return Math.round((distanceKm / averageSpeedKmh) * 60);
}

/**
 * Geocode address (placeholder - in production, use a geocoding service like Google Maps, OpenStreetMap, etc.)
 * This is a stub that would need to be implemented with a real geocoding API
 */
export async function geocodeAddress(_address: string, _city: string, _postalCode: string): Promise<{ lat: number; lon: number } | null> {
    // TODO: Implement with a real geocoding service
    // Example: Google Maps Geocoding API, OpenStreetMap Nominatim, etc.
    console.warn('Geocoding not implemented - using placeholder');
    return null;
}

/**
 * Reverse geocode coordinates to address (placeholder)
 */
export async function reverseGeocode(_lat: number, _lon: number): Promise<string | null> {
    // TODO: Implement with a real reverse geocoding service
    console.warn('Reverse geocoding not implemented - using placeholder');
    return null;
}

