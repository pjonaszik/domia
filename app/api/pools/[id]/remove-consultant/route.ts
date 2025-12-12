// /app/api/pools/[id]/remove-consultant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consultantPools, consultantPoolMembers } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can remove consultants from pools' }, { status: 403 });
        }

        const { id: poolId } = await params;
        const { searchParams } = new URL(req.url);
        const consultantId = searchParams.get('consultantId');

        // Security: Validate pool ID format
        if (!poolId || typeof poolId !== 'string' || poolId.length > 128) {
            return NextResponse.json({ error: 'Invalid pool ID' }, { status: 400 });
        }

        // Security: Validate consultant ID
        if (!consultantId || typeof consultantId !== 'string' || consultantId.length > 128) {
            return NextResponse.json(
                { error: 'Valid consultant ID is required' },
                { status: 400 }
            );
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

        // Check if consultant is in this pool
        const [existing] = await db
            .select()
            .from(consultantPoolMembers)
            .where(
                and(
                    eq(consultantPoolMembers.poolId, poolId),
                    eq(consultantPoolMembers.consultantId, consultantId)
                )
            )
            .limit(1);

        if (!existing) {
            return NextResponse.json(
                { error: 'Consultant is not in this pool' },
                { status: 404 }
            );
        }

        // Remove consultant from pool
        await db
            .delete(consultantPoolMembers)
            .where(
                and(
                    eq(consultantPoolMembers.poolId, poolId),
                    eq(consultantPoolMembers.consultantId, consultantId)
                )
            );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove consultant from pool error:', error);
        return NextResponse.json(
            { error: 'Failed to remove consultant from pool' },
            { status: 500 }
        );
    }
}

