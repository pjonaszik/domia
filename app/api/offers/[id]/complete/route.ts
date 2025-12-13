// /app/api/offers/[id]/complete/route.ts
// Consultant completes a mission and submits hours worked

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobOffers, missionHours } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { hoursWorked } = body;

        // Validate hours worked
        if (!hoursWorked || isNaN(parseFloat(hoursWorked.toString())) || parseFloat(hoursWorked.toString()) <= 0) {
            return NextResponse.json(
                { error: 'Hours worked is required and must be greater than 0' },
                { status: 400 }
            );
        }

        // Get the offer
        const [offer] = await db
            .select()
            .from(jobOffers)
            .where(eq(jobOffers.id, id))
            .limit(1);

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Verify that the user is the worker
        if (offer.workerId !== auth.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Verify that the offer is in progress
        if (offer.status !== 'in_progress') {
            return NextResponse.json(
                { error: 'Mission must be in progress to complete it' },
                { status: 400 }
            );
        }

        // Check if hours have already been submitted
        const [existingHours] = await db
            .select()
            .from(missionHours)
            .where(
                and(
                    eq(missionHours.offerId, id),
                    eq(missionHours.workerId, auth.user.id)
                )
            )
            .limit(1);

        if (existingHours) {
            // Update existing hours if status is needs_correction
            if (existingHours.status === 'needs_correction') {
                await db
                    .update(missionHours)
                    .set({
                        hoursWorked: hoursWorked.toString(),
                        status: 'pending_validation',
                        rejectionNote: null,
                        updatedAt: new Date(),
                    })
                    .where(eq(missionHours.id, existingHours.id));

                // Update offer status
                await db
                    .update(jobOffers)
                    .set({
                        status: 'completed_pending_validation',
                        updatedAt: new Date(),
                    })
                    .where(eq(jobOffers.id, id));

                return NextResponse.json({
                    success: true,
                    message: 'Hours updated and submitted for validation',
                });
            } else {
                return NextResponse.json(
                    { error: 'Hours have already been submitted for this mission' },
                    { status: 400 }
                );
            }
        }

        // Create new mission hours entry
        const [newHours] = await db
            .insert(missionHours)
            .values({
                offerId: id,
                workerId: auth.user.id,
                hoursWorked: hoursWorked.toString(),
                status: 'pending_validation',
            })
            .returning();

        // Update offer status
        await db
            .update(jobOffers)
            .set({
                status: 'completed_pending_validation',
                updatedAt: new Date(),
            })
            .where(eq(jobOffers.id, id));

        return NextResponse.json({
            success: true,
            hours: newHours,
        });
    } catch (error) {
        console.error('Complete mission error:', error);
        return NextResponse.json(
            { error: 'Failed to complete mission' },
            { status: 500 }
        );
    }
}

