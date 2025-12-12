// /app/api/pools/[id]/add-consultant/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consultantPools, consultantPoolMembers, workerClients } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can add consultants to pools' }, { status: 403 });
        }

        const { id: poolId } = await params;
        
        // Security: Validate pool ID format
        if (!poolId || typeof poolId !== 'string' || poolId.length > 128) {
            return NextResponse.json({ error: 'Invalid pool ID' }, { status: 400 });
        }

        const body = await req.json();
        const { consultantId } = body;

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

        // Check if consultant is already in this pool
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

        if (existing) {
            return NextResponse.json(
                { error: 'Consultant is already in this pool' },
                { status: 400 }
            );
        }

        // Add consultant to pool
        await db
            .insert(consultantPoolMembers)
            .values({
                poolId,
                consultantId,
            });

        // Also ensure consultant is in workerClients if not already
        const [existingWorkerClient] = await db
            .select()
            .from(workerClients)
            .where(
                and(
                    eq(workerClients.workerId, consultantId),
                    eq(workerClients.clientId, auth.user.id)
                )
            )
            .limit(1);

        if (!existingWorkerClient) {
            await db
                .insert(workerClients)
                .values({
                    workerId: consultantId,
                    clientId: auth.user.id,
                });
        }

        return NextResponse.json({ success: true }, { status: 201 });
    } catch (error) {
        console.error('Add consultant to pool error:', error);
        return NextResponse.json(
            { error: 'Failed to add consultant to pool' },
            { status: 500 }
        );
    }
}

