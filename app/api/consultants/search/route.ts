// /app/api/consultants/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, consultantPoolMembers, consultantPools } from '@/lib/db/schema';
import { and, or, isNotNull, eq, inArray, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only companies can search for consultants
        const userIsCompany = isCompany(auth.user);
        
        if (!userIsCompany) {
            return NextResponse.json({ error: 'Only companies can search for consultants' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        let searchTerm = searchParams.get('q') || '';
        const limitParam = searchParams.get('limit');
        
        // Security: Validate and sanitize inputs
        // Trim and limit search term length to prevent abuse
        searchTerm = searchTerm.trim().slice(0, 100);
        
        // Validate limit (min 1, max 50 for performance)
        const limit = Math.min(Math.max(parseInt(limitParam || '20', 10) || 20, 1), 50);

        // Build search conditions
        // Consultants are auto-entrepreneurs (physical persons) - they have firstName not null
        // Companies (legal entities) have firstName = null
        const conditions = [
            // Only auto-entrepreneurs (physical persons), not legal entities
            // Legal entities have firstName = null, auto-entrepreneurs have firstName != null
            isNotNull(users.firstName),
        ];

        if (searchTerm.length >= 2) {
            // Security: Use parameterized query (Drizzle handles this, but we validate input)
            // Use ILIKE for case-insensitive search in PostgreSQL
            // Escape single quotes in search term to prevent SQL injection
            const escapedSearchTerm = searchTerm.replace(/'/g, "''");
            const searchPattern = `%${escapedSearchTerm}%`;
            conditions.push(
                or(
                    sql`LOWER(${users.firstName}::text) LIKE LOWER(${sql.raw(`'${searchPattern}'`)})`,
                    sql`LOWER(${users.lastName}::text) LIKE LOWER(${sql.raw(`'${searchPattern}'`)})`,
                    sql`LOWER(COALESCE(${users.profession}::text, '')) LIKE LOWER(${sql.raw(`'${searchPattern}'`)})`,
                    sql`LOWER(COALESCE(${users.city}::text, '')) LIKE LOWER(${sql.raw(`'${searchPattern}'`)})`,
                    sql`LOWER(${users.email}::text) LIKE LOWER(${sql.raw(`'${searchPattern}'`)})`
                )!
            );
        } else if (searchTerm.length > 0) {
            // Search term too short
            return NextResponse.json({ consultants: [] });
        }

        // First, get consultants matching search
        const consultants = await db
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
                hourlyRate: users.hourlyRate,
            })
            .from(users)
            .where(and(...conditions))
            .limit(limit);

        // Get all pools for this company
        const companyPools = await db
            .select({ id: consultantPools.id })
            .from(consultantPools)
            .where(eq(consultantPools.companyId, auth.user.id));

        const poolIds = companyPools.map(p => p.id);

        // Get all consultants already in any pool of this company
        // Note: We only check consultantPoolMembers, not workerClients
        // workerClients is a separate relationship that doesn't mean the consultant is in a pool
        let consultantsInPools: string[] = [];
        if (poolIds.length > 0) {
            const members = await db
                .select({ consultantId: consultantPoolMembers.consultantId })
                .from(consultantPoolMembers)
                .where(inArray(consultantPoolMembers.poolId, poolIds));
            consultantsInPools = members.map(m => m.consultantId);
        }

        // Enrich consultants with pool membership info
        // A consultant is "in pool" only if they are in consultantPoolMembers
        const enrichedConsultants = consultants.map(consultant => ({
            ...consultant,
            isInPool: consultantsInPools.includes(consultant.id),
        }));

        return NextResponse.json({ consultants: enrichedConsultants });
    } catch (error) {
        console.error('Search consultants error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to search consultants';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

