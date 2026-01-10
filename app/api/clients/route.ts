// /app/api/clients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { formatAddressForGeocoding, geocodeAddressWithNominatim } from '@/lib/server/geocoding';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const clientList = await db
            .select()
            .from(clients)
            .where(eq(clients.userId, auth.user!.id))
            .orderBy(clients.createdAt);

        return NextResponse.json({ clients: clientList });
    } catch (error) {
        console.error('Get clients error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch clients' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await req.json();
        const { firstName, lastName, phone, email, address, city, postalCode, country, notes, emergencyContact } = body;

        if (!firstName || !lastName || !address || !city || !postalCode) {
            return NextResponse.json(
                { error: 'First name, last name, address, city, and postal code are required' },
                { status: 400 }
            );
        }

        // Best-effort geocoding (do not block creation if it fails)
        const geocodeQuery = formatAddressForGeocoding({
            address,
            postalCode,
            city,
            country: country || 'France',
        });
        const coords = await geocodeAddressWithNominatim({
            address: geocodeQuery,
            language: auth.user?.language || 'fr',
            country: country || 'France',
        });

        const [newClient] = await db
            .insert(clients)
            .values({
                userId: auth.user!.id,
                firstName,
                lastName,
                phone: phone || null,
                email: email || null,
                address,
                city,
                postalCode,
                country: country || 'France',
                latitude: coords ? coords.lat.toString() : null,
                longitude: coords ? coords.lon.toString() : null,
                notes: notes || null,
                emergencyContact: emergencyContact || null,
            })
            .returning();

        return NextResponse.json({ client: newClient }, { status: 201 });
    } catch (error) {
        // Sanitize error for production
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            console.error('Create client error:', error instanceof Error ? error.message : 'Unknown error');
        } else {
            console.error('Create client error:', error);
        }
        return NextResponse.json(
            { error: 'Failed to create client' },
            { status: 500 }
        );
    }
}

