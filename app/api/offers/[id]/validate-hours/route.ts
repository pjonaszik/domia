// /app/api/offers/[id]/validate-hours/route.ts
// Company validates or rejects hours worked by consultant for a specific offer

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';
import { validateOfferHours } from '@/lib/server/mission-hours';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
        const { hoursId, action, rejectionNote } = body;

        if (!hoursId || !action) {
            return NextResponse.json({ error: 'Hours ID and action are required' }, { status: 400 });
        }

        if (action !== 'validate' && action !== 'reject') {
            return NextResponse.json({ error: 'Action must be "validate" or "reject"' }, { status: 400 });
        }

        const result = await validateOfferHours({
            companyId: auth.user.id,
            offerId,
            hoursId,
            action,
            rejectionNote,
        });

        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            success: true,
            message: action === 'validate' ? 'Hours validated successfully' : 'Hours rejected',
        });
    } catch (error) {
        console.error('Validate hours error:', error);
        return NextResponse.json({ error: 'Failed to validate hours' }, { status: 500 });
    }
}


