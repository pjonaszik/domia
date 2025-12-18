// /app/api/offers/[id]/hours/route.ts
// Get hours worked for a specific offer (worker or company access)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { db } from '@/lib/db';
import { jobOffers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getOfferHoursWithWorkerAndSepa } from '@/lib/server/mission-hours';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: offerId } = await params;

        const [offer] = await db.select().from(jobOffers).where(eq(jobOffers.id, offerId)).limit(1);
        if (!offer) {
            return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
        }

        if (offer.workerId !== auth.user.id && offer.clientId !== auth.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const hours = await getOfferHoursWithWorkerAndSepa(offerId);
        return NextResponse.json({ hours });
    } catch (error) {
        console.error('Get offer hours error:', error);
        return NextResponse.json({ error: 'Failed to fetch hours' }, { status: 500 });
    }
}


