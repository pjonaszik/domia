// /app/api/tours/optimize/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { optimizeTourRoute } from '@/lib/utils/tour-optimizer';

export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await req.json();
        const { appointmentIds, startLocation } = body;

        if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
            return NextResponse.json(
                { error: 'Appointment IDs array is required' },
                { status: 400 }
            );
        }

        // Optimize the route
        const optimizedRoute = await optimizeTourRoute(appointmentIds, startLocation);

        return NextResponse.json({ optimizedRoute });
    } catch (error) {
        console.error('Optimize tour error:', error);
        return NextResponse.json(
            { error: 'Failed to optimize tour' },
            { status: 500 }
        );
    }
}

