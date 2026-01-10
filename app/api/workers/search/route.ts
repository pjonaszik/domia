// /app/api/workers/search/route.ts
// Canonical search endpoint for "workers" (aka consultants, from company point of view)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, consultantPools, consultantPoolMembers } from '@/lib/db/schema';
import { and, or, isNotNull, eq, inArray, sql, like } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // This search is a company feature (search consultants/workers to add to pools or send offers)
        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can search for workers' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);

        // Text search (used by ConsultantSearch)
        const searchTerm = (searchParams.get('q') || '').trim().slice(0, 100);
        const limitParam = searchParams.get('limit');

        // Filter search (used by dashboard/workers)
        const profession = searchParams.get('profession');
        const city = searchParams.get('city');
        const postalCode = searchParams.get('postalCode');

        const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 50);

        // Base conditions: only physical persons (workers/consultants)
        const conditions = [
            isNotNull(users.businessName),
            isNotNull(users.profession),
        ];

        if (profession) {
            conditions.push(eq(users.profession, profession));
        }

        if (city) {
            conditions.push(like(users.city, `%${city}%`));
        }

        if (postalCode) {
            conditions.push(eq(users.postalCode, postalCode));
        }

        if (searchTerm.length >= 2) {
            // Use Drizzle placeholders instead of sql.raw() to prevent SQL injection
            const searchPattern = `%${searchTerm}%`;
            conditions.push(
                or(
                    sql`LOWER(${users.businessName}::text) LIKE LOWER(${searchPattern})`,
                    sql`LOWER(COALESCE(${users.profession}::text, '')) LIKE LOWER(${searchPattern})`,
                    sql`LOWER(COALESCE(${users.city}::text, '')) LIKE LOWER(${searchPattern})`,
                    sql`LOWER(${users.email}::text) LIKE LOWER(${searchPattern})`
                )!
            );
        } else if (searchTerm.length > 0) {
            // Search term too short (1 char) -> return empty set (same UX as before)
            return NextResponse.json({ workers: [] });
        }

        const workers = await db
            .select({
                id: users.id,
                businessName: users.businessName,
                email: users.email,
                phone: users.phone,
                profession: users.profession,
                adeliNumber: users.adeliNumber,
                agrementNumber: users.agrementNumber,
                address: users.address,
                city: users.city,
                postalCode: users.postalCode,
                country: users.country,
                hourlyRate: users.hourlyRate,
            })
            .from(users)
            .where(and(...conditions))
            .limit(limit);

        // Pool membership enrichment (for companies)
        const companyPools = await db
            .select({ id: consultantPools.id })
            .from(consultantPools)
            .where(eq(consultantPools.companyId, auth.user.id));

        const poolIds = companyPools.map(p => p.id);
        let consultantsInPools: string[] = [];
        if (poolIds.length > 0) {
            const members = await db
                .select({ consultantId: consultantPoolMembers.consultantId })
                .from(consultantPoolMembers)
                .where(inArray(consultantPoolMembers.poolId, poolIds));
            consultantsInPools = members.map(m => m.consultantId);
        }

        const enrichedWorkers = workers.map(worker => ({
            ...worker,
            isInPool: consultantsInPools.includes(worker.id),
        }));

        return NextResponse.json({ workers: enrichedWorkers });
    } catch (error) {
        console.error('Search workers error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to search workers';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

