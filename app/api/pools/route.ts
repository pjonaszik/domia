// /app/api/pools/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consultantPools, consultantPoolMembers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

// GET - List all pools for the company
export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can manage pools' }, { status: 403 });
        }

        // Optimized: Single query with LEFT JOIN to get pools and member counts
        // This eliminates N+1 query problem
        const poolsWithCounts = await db
            .select({
                id: consultantPools.id,
                name: consultantPools.name,
                color: consultantPools.color,
                description: consultantPools.description,
                createdAt: consultantPools.createdAt,
                updatedAt: consultantPools.updatedAt,
                memberCount: sql<number>`COALESCE(${sql`(
                    SELECT COUNT(*)::int
                    FROM ${consultantPoolMembers}
                    WHERE ${consultantPoolMembers.poolId} = ${consultantPools.id}
                )`}, 0)`.as('memberCount'),
            })
            .from(consultantPools)
            .where(eq(consultantPools.companyId, auth.user.id));

        return NextResponse.json({ pools: poolsWithCounts });
    } catch (error) {
        console.error('Get pools error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pools' },
            { status: 500 }
        );
    }
}

// POST - Create a new pool
export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can create pools' }, { status: 403 });
        }

        const body = await req.json();
        let { name, color } = body;
        const { description } = body;

        // Security: Validate and sanitize inputs
        if (!name || typeof name !== 'string') {
            return NextResponse.json(
                { error: 'Pool name is required' },
                { status: 400 }
            );
        }

        name = name.trim();
        if (name.length === 0 || name.length > 255) {
            return NextResponse.json(
                { error: 'Pool name must be between 1 and 255 characters' },
                { status: 400 }
            );
        }

        // Validate color format (hex color or CSS color name)
        if (color && typeof color === 'string') {
            color = color.trim().slice(0, 50);
            // Basic validation: hex color or CSS color name
            if (!/^#?[0-9A-Fa-f]{3,6}$|^[a-zA-Z]+$/.test(color)) {
                return NextResponse.json(
                    { error: 'Invalid color format' },
                    { status: 400 }
                );
            }
        } else {
            color = null;
        }

        // Validate description length
        let finalDescription: string | null = null;
        if (description && typeof description === 'string') {
            finalDescription = description.trim().slice(0, 1000);
        }

        const [newPool] = await db
            .insert(consultantPools)
            .values({
                companyId: auth.user.id,
                name,
                color,
                description: finalDescription,
            })
            .returning();

        return NextResponse.json({ pool: { ...newPool, memberCount: 0 } }, { status: 201 });
    } catch (error) {
        console.error('Create pool error:', error);
        return NextResponse.json(
            { error: 'Failed to create pool' },
            { status: 500 }
        );
    }
}

