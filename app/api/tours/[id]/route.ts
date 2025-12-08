// /app/api/tours/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tours } from '@/lib/db/schema';
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
        const [tour] = await db
            .select()
            .from(tours)
            .where(
                and(
                    eq(tours.id, id),
                    eq(tours.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!tour) {
            return NextResponse.json(
                { error: 'Tour not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ tour });
    } catch (error) {
        console.error('Get tour error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tour' },
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
        const { name, date, optimizedOrder, totalDistance, estimatedDuration, status: tourStatus, notes } = body;

        // Check if tour exists and belongs to user
        const [existingTour] = await db
            .select()
            .from(tours)
            .where(
                and(
                    eq(tours.id, id),
                    eq(tours.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!existingTour) {
            return NextResponse.json(
                { error: 'Tour not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (name !== undefined) updateData.name = name;
        if (date !== undefined) updateData.date = new Date(date);
        if (optimizedOrder !== undefined) updateData.optimizedOrder = optimizedOrder;
        if (totalDistance !== undefined) updateData.totalDistance = String(totalDistance);
        if (estimatedDuration !== undefined) updateData.estimatedDuration = estimatedDuration;
        if (notes !== undefined) updateData.notes = notes;
        if (tourStatus !== undefined) {
            updateData.status = tourStatus;
            if (tourStatus === 'in_progress') {
                updateData.startedAt = new Date();
            }
            if (tourStatus === 'completed') {
                updateData.completedAt = new Date();
            }
        }

        const [updatedTour] = await db
            .update(tours)
            .set(updateData)
            .where(eq(tours.id, id))
            .returning();

        return NextResponse.json({ tour: updatedTour });
    } catch (error) {
        console.error('Update tour error:', error);
        return NextResponse.json(
            { error: 'Failed to update tour' },
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
        // Check if tour exists and belongs to user
        const [existingTour] = await db
            .select()
            .from(tours)
            .where(
                and(
                    eq(tours.id, id),
                    eq(tours.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!existingTour) {
            return NextResponse.json(
                { error: 'Tour not found' },
                { status: 404 }
            );
        }

        await db
            .delete(tours)
            .where(eq(tours.id, id));

        return NextResponse.json({ message: 'Tour deleted successfully' });
    } catch (error) {
        console.error('Delete tour error:', error);
        return NextResponse.json(
            { error: 'Failed to delete tour' },
            { status: 500 }
        );
    }
}

