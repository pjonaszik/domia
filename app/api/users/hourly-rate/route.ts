// /app/api/users/hourly-rate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function PUT(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { hourlyRate } = body;

        // Validate hourly rate
        if (hourlyRate !== null && hourlyRate !== undefined) {
            const rate = parseFloat(hourlyRate);
            if (isNaN(rate) || rate < 0) {
                return NextResponse.json(
                    { error: 'Invalid hourly rate. Must be a positive number.' },
                    { status: 400 }
                );
            }
        }

        // Update user's hourly rate
        const [updatedUser] = await db
            .update(users)
            .set({
                hourlyRate: hourlyRate ? hourlyRate.toString() : null,
                updatedAt: new Date(),
            })
            .where(eq(users.id, auth.user.id))
            .returning();

        const { passwordHash: _, ...userWithoutPassword } = updatedUser;

        return NextResponse.json({ user: userWithoutPassword });
    } catch (error) {
        console.error('Update hourly rate error:', error);
        return NextResponse.json(
            { error: 'Failed to update hourly rate' },
            { status: 500 }
        );
    }
}

