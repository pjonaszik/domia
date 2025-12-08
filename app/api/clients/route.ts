// /app/api/clients/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

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
        const { firstName, lastName, phone, email, address, city, postalCode, country, notes, medicalNotes, allergies, emergencyContact } = body;

        if (!firstName || !lastName || !address || !city || !postalCode) {
            return NextResponse.json(
                { error: 'First name, last name, address, city, and postal code are required' },
                { status: 400 }
            );
        }

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
                notes: notes || null,
                medicalNotes: medicalNotes || null,
                allergies: allergies || null,
                emergencyContact: emergencyContact || null,
            })
            .returning();

        return NextResponse.json({ client: newClient }, { status: 201 });
    } catch (error) {
        console.error('Create client error:', error);
        return NextResponse.json(
            { error: 'Failed to create client' },
            { status: 500 }
        );
    }
}

