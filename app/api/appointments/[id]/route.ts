// /app/api/appointments/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments } from '@/lib/db/schema';
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
        const [appointment] = await db
            .select()
            .from(appointments)
            .where(
                and(
                    eq(appointments.id, id),
                    eq(appointments.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ appointment });
    } catch (error) {
        console.error('Get appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch appointment' },
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
        const { startTime, endTime, duration, serviceName, notes, price, status: appointmentStatus } = body;

        // Check if appointment exists and belongs to user
        const [existingAppointment] = await db
            .select()
            .from(appointments)
            .where(
                and(
                    eq(appointments.id, id),
                    eq(appointments.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!existingAppointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (startTime !== undefined) updateData.startTime = new Date(startTime);
        if (endTime !== undefined) updateData.endTime = new Date(endTime);
        if (duration !== undefined) updateData.duration = duration;
        if (serviceName !== undefined) updateData.serviceName = serviceName;
        if (notes !== undefined) updateData.notes = notes;
        if (price !== undefined) updateData.price = String(price);
        if (appointmentStatus !== undefined) {
            updateData.status = appointmentStatus;
            if (appointmentStatus === 'completed') {
                updateData.completedAt = new Date();
            }
            if (appointmentStatus === 'cancelled') {
                updateData.cancelledAt = new Date();
            }
        }

        const [updatedAppointment] = await db
            .update(appointments)
            .set(updateData)
            .where(eq(appointments.id, id))
            .returning();

        return NextResponse.json({ appointment: updatedAppointment });
    } catch (error) {
        console.error('Update appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to update appointment' },
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
        // Check if appointment exists and belongs to user
        const [existingAppointment] = await db
            .select()
            .from(appointments)
            .where(
                and(
                    eq(appointments.id, id),
                    eq(appointments.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!existingAppointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        await db
            .delete(appointments)
            .where(eq(appointments.id, id));

        return NextResponse.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        console.error('Delete appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to delete appointment' },
            { status: 500 }
        );
    }
}

