// /app/api/users/me/route.ts
// Get current authenticated user data (canonical "me" endpoint)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { updateUserHourlyRate } from '@/lib/server/user-profile';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);

        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        return NextResponse.json({
            user: auth.user,
        });
    } catch (error) {
        console.error('Get user error:', error);
        return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
    }
}

// Update current authenticated user (limited fields; currently supports hourlyRate)
export async function PUT(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));

        if (!body || typeof body !== 'object') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        if (!('hourlyRate' in body)) {
            return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
        }

        try {
            const updatedUser = await updateUserHourlyRate(auth.user.id, (body as any).hourlyRate);
            return NextResponse.json({ user: updatedUser });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Invalid hourly rate.';
            return NextResponse.json({ error: message }, { status: 400 });
        }
    } catch (error) {
        console.error('Update me error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}


