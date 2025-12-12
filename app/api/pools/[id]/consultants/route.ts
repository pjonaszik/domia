// /app/api/pools/[id]/consultants/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consultantPools, consultantPoolMembers, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can view pool consultants' }, { status: 403 });
        }

        const { id: poolId } = await params;

        // Security: Validate pool ID format
        if (!poolId || typeof poolId !== 'string' || poolId.length > 128) {
            return NextResponse.json({ error: 'Invalid pool ID' }, { status: 400 });
        }

        // Verify pool belongs to company
        const [pool] = await db
            .select()
            .from(consultantPools)
            .where(
                and(
                    eq(consultantPools.id, poolId),
                    eq(consultantPools.companyId, auth.user.id)
                )
            )
            .limit(1);

        if (!pool) {
            return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
        }

        // Get all consultants in this pool
        const poolMembers = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                phone: users.phone,
                profession: users.profession,
                adeliNumber: users.adeliNumber,
                agrementNumber: users.agrementNumber,
                city: users.city,
                postalCode: users.postalCode,
            })
            .from(consultantPoolMembers)
            .innerJoin(users, eq(consultantPoolMembers.consultantId, users.id))
            .where(eq(consultantPoolMembers.poolId, poolId));

        return NextResponse.json({ consultants: poolMembers });
    } catch (error) {
        console.error('Get pool consultants error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch pool consultants' },
            { status: 500 }
        );
    }
}

