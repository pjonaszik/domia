// /lib/utils/tour-optimizer.ts

import { db } from '@/lib/db';
import { appointments, clients } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
 * Simple nearest neighbor algorithm for TSP
 */
function nearestNeighborTSP(
    locations: Array<{ id: string; lat: number; lon: number }>,
    startLocation?: { lat: number; lon: number }
): string[] {
    if (locations.length === 0) return [];
    if (locations.length === 1) return [locations[0].id];

    const unvisited = [...locations];
    const route: string[] = [];
    let current: { id: string; lat: number; lon: number } | null = null;

    // Start from the provided start location or first location
    if (startLocation) {
        // Find nearest location to start
        let nearest = unvisited[0];
        let minDist = calculateDistance(startLocation.lat, startLocation.lon, nearest.lat, nearest.lon);
        for (const loc of unvisited) {
            const dist = calculateDistance(startLocation.lat, startLocation.lon, loc.lat, loc.lon);
            if (dist < minDist) {
                minDist = dist;
                nearest = loc;
            }
        }
        current = nearest;
    } else {
        current = unvisited.shift()!;
    }

    route.push(current.id);

    // Visit nearest unvisited location until all are visited
    while (unvisited.length > 0) {
        let nearest = unvisited[0];
        let minDist = calculateDistance(current.lat, current.lon, nearest.lat, nearest.lon);
        let nearestIndex = 0;

        for (let i = 1; i < unvisited.length; i++) {
            const dist = calculateDistance(current.lat, current.lon, unvisited[i].lat, unvisited[i].lon);
            if (dist < minDist) {
                minDist = dist;
                nearest = unvisited[i];
                nearestIndex = i;
            }
        }

        current = nearest;
        route.push(current.id);
        unvisited.splice(nearestIndex, 1);
    }

    return route;
}

/**
 * Optimize tour route for given appointment IDs
 */
export async function optimizeTourRoute(
    appointmentIds: string[],
    startLocation?: { lat: number; lon: number }
): Promise<{
    optimizedOrder: string[];
    totalDistance: number;
    estimatedDuration: number;
}> {
    if (appointmentIds.length === 0) {
        return {
            optimizedOrder: [],
            totalDistance: 0,
            estimatedDuration: 0,
        };
    }

    // Fetch appointments with client addresses
    const appointmentsList = await db
        .select({
            id: appointments.id,
            clientId: appointments.clientId,
            startTime: appointments.startTime,
            duration: appointments.duration,
        })
        .from(appointments)
        .where(inArray(appointments.id, appointmentIds));

    if (appointmentsList.length === 0) {
        throw new Error('No appointments found');
    }

    // Fetch clients with coordinates
    const clientIds = [...new Set(appointmentsList.map(a => a.clientId))];
    const clientsList = await db
        .select({
            id: clients.id,
            latitude: clients.latitude,
            longitude: clients.longitude,
        })
        .from(clients)
        .where(inArray(clients.id, clientIds));

    // Create location map
    const locationMap = new Map<string, { lat: number; lon: number }>();
    for (const client of clientsList) {
        if (client.latitude && client.longitude) {
            locationMap.set(client.id, {
                lat: parseFloat(client.latitude),
                lon: parseFloat(client.longitude),
            });
        }
    }

    // Build locations array for appointments
    const locations: Array<{ id: string; lat: number; lon: number }> = [];
    for (const appointment of appointmentsList) {
        const location = locationMap.get(appointment.clientId);
        if (location) {
            locations.push({
                id: appointment.id,
                ...location,
            });
        }
    }

    if (locations.length === 0) {
        // If no coordinates, return original order
        return {
            optimizedOrder: appointmentIds,
            totalDistance: 0,
            estimatedDuration: appointmentsList.reduce((sum, a) => sum + (a.duration || 0), 0),
        };
    }

    // Optimize route
    const optimizedOrder = nearestNeighborTSP(locations, startLocation);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 0; i < optimizedOrder.length - 1; i++) {
        const current = locations.find(l => l.id === optimizedOrder[i]);
        const next = locations.find(l => l.id === optimizedOrder[i + 1]);
        if (current && next) {
            totalDistance += calculateDistance(current.lat, current.lon, next.lat, next.lon);
        }
    }

    // Estimate duration (assume 30 km/h average speed + service duration)
    const travelTime = (totalDistance / 30) * 60; // minutes
    const serviceTime = appointmentsList.reduce((sum, a) => sum + (a.duration || 0), 0);
    const estimatedDuration = Math.round(travelTime + serviceTime);

    return {
        optimizedOrder,
        totalDistance: Math.round(totalDistance * 100) / 100, // Round to 2 decimals
        estimatedDuration,
    };
}

