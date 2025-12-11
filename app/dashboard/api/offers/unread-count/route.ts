// /app/dashboard/api/offers/unread-count/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobOffers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { count } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        // Compter les offres en attente pour le travailleur
        const [result] = await db
            .select({ count: count() })
            .from(jobOffers)
            .where(
                and(
                    eq(jobOffers.workerId, auth.user!.id),
                    eq(jobOffers.status, 'pending')
                )
            );

        return NextResponse.json({ count: result.count });
    } catch (error) {
        console.error('Get unread count error:', error);
        return NextResponse.json(
            { error: 'Failed to get unread count' },
            { status: 500 }
        );
    }
}

