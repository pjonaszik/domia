// /app/api/missions/[id]/validate-hours/route.ts
// Company validates or rejects hours worked by consultant

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { missionHours, jobOffers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can validate hours' }, { status: 403 });
        }

        const { id: offerId } = await params;
        const body = await req.json();
        const { hoursId, action, rejectionNote } = body; // action: 'validate' or 'reject'

        if (!hoursId || !action) {
            return NextResponse.json(
                { error: 'Hours ID and action are required' },
                { status: 400 }
            );
        }

        if (action !== 'validate' && action !== 'reject') {
            return NextResponse.json(
                { error: 'Action must be "validate" or "reject"' },
                { status: 400 }
            );
        }

        if (action === 'reject' && (!rejectionNote || typeof rejectionNote !== 'string' || rejectionNote.trim().length === 0)) {
            return NextResponse.json(
                { error: 'Rejection note is required when rejecting hours' },
                { status: 400 }
            );
        }

        // Get the mission hours
        const [hours] = await db
            .select()
            .from(missionHours)
            .where(eq(missionHours.id, hoursId))
            .limit(1);

        if (!hours) {
            return NextResponse.json(
                { error: 'Hours not found' },
                { status: 404 }
            );
        }

        // Verify the offer belongs to the company
        const [offer] = await db
            .select()
            .from(jobOffers)
            .where(eq(jobOffers.id, hours.offerId))
            .limit(1);

        if (!offer || offer.clientId !== auth.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Verify the hours are in pending_validation or needs_correction status
        if (hours.status !== 'pending_validation' && hours.status !== 'needs_correction') {
            return NextResponse.json(
                { error: 'Hours are not in a valid state for validation' },
                { status: 400 }
            );
        }

        if (action === 'validate') {
            // Validate the hours
            await db
                .update(missionHours)
                .set({
                    status: 'validated',
                    validatedAt: new Date(),
                    validatedBy: auth.user.id,
                    updatedAt: new Date(),
                })
                .where(eq(missionHours.id, hoursId));

            // Update offer status to completed_validated
            await db
                .update(jobOffers)
                .set({
                    status: 'completed_validated',
                    updatedAt: new Date(),
                })
                .where(eq(jobOffers.id, hours.offerId));
        } else {
            // Reject the hours
            await db
                .update(missionHours)
                .set({
                    status: 'needs_correction',
                    rejectionNote: rejectionNote.trim(),
                    updatedAt: new Date(),
                })
                .where(eq(missionHours.id, hoursId));

            // Update offer status back to needs_correction
            await db
                .update(jobOffers)
                .set({
                    status: 'needs_correction',
                    updatedAt: new Date(),
                })
                .where(eq(jobOffers.id, hours.offerId));
        }

        return NextResponse.json({
            success: true,
            message: action === 'validate' ? 'Hours validated successfully' : 'Hours rejected',
        });
    } catch (error) {
        console.error('Validate hours error:', error);
        return NextResponse.json(
            { error: 'Failed to validate hours' },
            { status: 500 }
        );
    }
}

