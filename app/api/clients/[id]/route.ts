// /app/api/clients/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

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
        const { firstName, lastName, phone, email, address, city, postalCode, country, notes, medicalNotes, allergies, emergencyContact, isActive } = body;

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

        const [updatedClient] = await db
            .update(clients)
            .set({
                firstName: firstName !== undefined ? firstName : existingClient.firstName,
                lastName: lastName !== undefined ? lastName : existingClient.lastName,
                phone: phone !== undefined ? phone : existingClient.phone,
                email: email !== undefined ? email : existingClient.email,
                address: address !== undefined ? address : existingClient.address,
                city: city !== undefined ? city : existingClient.city,
                postalCode: postalCode !== undefined ? postalCode : existingClient.postalCode,
                country: country !== undefined ? country : existingClient.country,
                notes: notes !== undefined ? notes : existingClient.notes,
                medicalNotes: medicalNotes !== undefined ? medicalNotes : existingClient.medicalNotes,
                allergies: allergies !== undefined ? allergies : existingClient.allergies,
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

