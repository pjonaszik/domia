// /app/api/tours/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tours } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const date = searchParams.get('date');

        const query = db
            .select()
            .from(tours)
            .where(eq(tours.userId, auth.user!.id));

        if (date) {
            // Filter by date if provided
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const nextDay = new Date(targetDate);
            nextDay.setDate(nextDay.getDate() + 1);

            // This is a simplified filter - in production you'd use proper date filtering
            const tourList = await query.orderBy(tours.date);
            const filtered = tourList.filter(tour => {
                const tourDate = new Date(tour.date);
                return tourDate >= targetDate && tourDate < nextDay;
            });
            return NextResponse.json({ tours: filtered });
        }

        const tourList = await query.orderBy(tours.date);

        return NextResponse.json({ tours: tourList });
    } catch (error) {
        console.error('Get tours error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch tours' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await req.json();
        const { name, date, optimizedOrder, totalDistance, estimatedDuration, notes } = body;

        if (!date) {
            return NextResponse.json(
                { error: 'Date is required' },
                { status: 400 }
            );
        }

        const [newTour] = await db
            .insert(tours)
            .values({
                userId: auth.user!.id,
                name: name || null,
                date: new Date(date),
                optimizedOrder: optimizedOrder || null,
                totalDistance: totalDistance ? String(totalDistance) : null,
                estimatedDuration: estimatedDuration || null,
                notes: notes || null,
            })
            .returning();

        return NextResponse.json({ tour: newTour }, { status: 201 });
    } catch (error) {
        console.error('Create tour error:', error);
        return NextResponse.json(
            { error: 'Failed to create tour' },
            { status: 500 }
        );
    }
}

