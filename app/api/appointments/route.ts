// /app/api/appointments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, clients } from '@/lib/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const clientId = searchParams.get('clientId');

        // Build conditions
        const conditions = [eq(appointments.userId, auth.user!.id)];

        if (startDate) {
            conditions.push(gte(appointments.startTime, new Date(startDate)));
        }

        if (endDate) {
            conditions.push(lte(appointments.endTime, new Date(endDate)));
        }

        if (clientId) {
            conditions.push(eq(appointments.clientId, clientId));
        }

        const appointmentList = await db
            .select()
            .from(appointments)
            .where(and(...conditions))
            .orderBy(desc(appointments.startTime));

        return NextResponse.json({ appointments: appointmentList });
    } catch (error) {
        console.error('Get appointments error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch appointments' },
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
        const { clientId, serviceId, tourId, startTime, endTime, duration, serviceName, notes, price } = body;

        if (!clientId || !startTime || !endTime) {
            return NextResponse.json(
                { error: 'Client ID, start time, and end time are required' },
                { status: 400 }
            );
        }

        // Verify client belongs to user
        const [client] = await db
            .select()
            .from(clients)
            .where(
                and(
                    eq(clients.id, clientId),
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

        const calculatedDuration = duration || Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000);

        const [newAppointment] = await db
            .insert(appointments)
            .values({
                userId: auth.user!.id,
                clientId,
                serviceId: serviceId || null,
                tourId: tourId || null,
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                duration: calculatedDuration,
                serviceName: serviceName || null,
                notes: notes || null,
                price: price ? String(price) : null,
            })
            .returning();

        return NextResponse.json({ appointment: newAppointment }, { status: 201 });
    } catch (error) {
        console.error('Create appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to create appointment' },
            { status: 500 }
        );
    }
}

