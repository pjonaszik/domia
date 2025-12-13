// /app/api/missions/[id]/hours/route.ts
// Get hours worked for a specific mission/offer

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { missionHours, jobOffers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: offerId } = await params;

        // Get the offer
        const [offer] = await db
            .select()
            .from(jobOffers)
            .where(eq(jobOffers.id, offerId))
            .limit(1);

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Verify the user has access (either worker or company)
        if (offer.workerId !== auth.user.id && offer.clientId !== auth.user.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Get hours for this offer
        const hours = await db
            .select({
                id: missionHours.id,
                hoursWorked: missionHours.hoursWorked,
                status: missionHours.status,
                rejectionNote: missionHours.rejectionNote,
                validatedAt: missionHours.validatedAt,
                createdAt: missionHours.createdAt,
                updatedAt: missionHours.updatedAt,
                worker: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                },
            })
            .from(missionHours)
            .innerJoin(users, eq(missionHours.workerId, users.id))
            .where(eq(missionHours.offerId, offerId));

        return NextResponse.json({ hours });
    } catch (error) {
        console.error('Get hours error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch hours' },
            { status: 500 }
        );
    }
}

