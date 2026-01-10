// /app/api/clients/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { formatAddressForGeocoding, geocodeAddressWithNominatim } from '@/lib/server/geocoding';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        const [client] = await db
            .select()
            .from(clients)
            .where(
                and(
                    eq(clients.id, id),
                    eq(clients.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ client });
    } catch (error) {
        console.error('Get client error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch client' },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { firstName, lastName, phone, email, address, city, postalCode, country, notes, emergencyContact, isActive } = body;

        // Check if client exists and belongs to user
        const [existingClient] = await db
            .select()
            .from(clients)
            .where(
                and(
                    eq(clients.id, id),
                    eq(clients.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!existingClient) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        const nextAddress = address !== undefined ? address : existingClient.address;
        const nextCity = city !== undefined ? city : existingClient.city;
        const nextPostalCode = postalCode !== undefined ? postalCode : existingClient.postalCode;
        const nextCountry = country !== undefined ? country : existingClient.country;

        const addressChanged =
            nextAddress !== existingClient.address ||
            nextCity !== existingClient.city ||
            nextPostalCode !== existingClient.postalCode ||
            nextCountry !== existingClient.country;

        let nextLatitude = existingClient.latitude;
        let nextLongitude = existingClient.longitude;
        if (addressChanged) {
            const geocodeQuery = formatAddressForGeocoding({
                address: nextAddress,
                postalCode: nextPostalCode,
                city: nextCity,
                country: nextCountry || 'France',
            });
            const coords = await geocodeAddressWithNominatim({
                address: geocodeQuery,
                language: auth.user?.language || 'fr',
                country: nextCountry || 'France',
            });
            nextLatitude = coords ? coords.lat.toString() : null;
            nextLongitude = coords ? coords.lon.toString() : null;
        }

        const [updatedClient] = await db
            .update(clients)
            .set({
                firstName: firstName !== undefined ? firstName : existingClient.firstName,
                lastName: lastName !== undefined ? lastName : existingClient.lastName,
                phone: phone !== undefined ? phone : existingClient.phone,
                email: email !== undefined ? email : existingClient.email,
                address: nextAddress,
                city: nextCity,
                postalCode: nextPostalCode,
                country: nextCountry,
                latitude: nextLatitude,
                longitude: nextLongitude,
                notes: notes !== undefined ? notes : existingClient.notes,
                emergencyContact: emergencyContact !== undefined ? emergencyContact : existingClient.emergencyContact,
                isActive: isActive !== undefined ? isActive : existingClient.isActive,
                updatedAt: new Date(),
            })
            .where(eq(clients.id, id))
            .returning();

        return NextResponse.json({ client: updatedClient });
    } catch (error) {
        console.error('Update client error:', error);
        return NextResponse.json(
            { error: 'Failed to update client' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        // Check if client exists and belongs to user
        const [existingClient] = await db
            .select()
            .from(clients)
            .where(
                and(
                    eq(clients.id, id),
                    eq(clients.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!existingClient) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        await db
            .delete(clients)
            .where(eq(clients.id, id));

        return NextResponse.json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Delete client error:', error);
        return NextResponse.json(
            { error: 'Failed to delete client' },
            { status: 500 }
        );
    }
}

