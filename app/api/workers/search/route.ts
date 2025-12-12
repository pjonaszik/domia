// /app/api/workers/search/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and, ne, isNotNull, like } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const profession = searchParams.get('profession');
        const city = searchParams.get('city');
        const postalCode = searchParams.get('postalCode');
        const radius = searchParams.get('radius'); // Optionnel pour recherche par rayon

        // Build conditions
        const conditions = [
            ne(users.id, auth.user!.id), // Exclure l'utilisateur connecté
            isNotNull(users.profession), // Seulement les utilisateurs avec une profession (travailleurs)
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

        const workers = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                phone: users.phone,
                profession: users.profession,
                address: users.address,
                city: users.city,
                postalCode: users.postalCode,
                country: users.country,
            })
            .from(users)
            .where(and(...conditions))
            .limit(50); // Limiter les résultats

        return NextResponse.json({ workers });
    } catch (error) {
        console.error('Search workers error:', error);
        return NextResponse.json(
            { error: 'Failed to search workers' },
            { status: 500 }
        );
    }
}

