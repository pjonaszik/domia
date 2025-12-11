// /app/dashboard/api/consultants/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users, consultantPoolMembers, consultantPools, workerClients } from '@/lib/db/schema';
import { and, or, like, isNotNull, sql } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only companies can search for consultants
        if (!isCompany(auth.user)) {
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

        // Build search conditions - search in firstName, lastName, profession, city
        const conditions = [
            // Only workers (not companies) - workers have firstName not null
            isNotNull(users.firstName),
        ];

        if (searchTerm.length >= 2) {
            // Security: Use parameterized query (Drizzle handles this, but we validate input)
            const searchPattern = `%${searchTerm}%`;
            conditions.push(
                or(
                    like(users.firstName, searchPattern),
                    like(users.lastName, searchPattern),
                    like(users.profession, searchPattern),
                    like(users.city, searchPattern),
                    like(users.email, searchPattern)
                )!
            );
        } else if (searchTerm.length > 0) {
            // Search term too short
            return NextResponse.json({ consultants: [] });
        }

        // Optimized: Single query with LEFT JOINs to check pool membership
        // This reduces from 3-4 queries to 1 query
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
                isInPool: sql<boolean>`COALESCE(
                    EXISTS(
                        SELECT 1 FROM ${consultantPoolMembers} 
                        WHERE ${consultantPoolMembers.consultantId} = ${users.id}
                        AND ${consultantPoolMembers.poolId} IN (
                            SELECT ${consultantPools.id} 
                            FROM ${consultantPools} 
                            WHERE ${consultantPools.companyId} = ${auth.user.id}
                        )
                    ) OR EXISTS(
                        SELECT 1 FROM ${workerClients}
                        WHERE ${workerClients.workerId} = ${users.id}
                        AND ${workerClients.clientId} = ${auth.user.id}
                    ),
                    false
                )`.as('isInPool'),
            })
            .from(users)
            .where(and(...conditions))
            .limit(limit);

        return NextResponse.json({ consultants });
    } catch (error) {
        console.error('Search consultants error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to search consultants';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

