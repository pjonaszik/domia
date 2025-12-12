// /app/api/offers/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobOffers, users } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        // Build conditions
        const conditions = [eq(jobOffers.workerId, auth.user!.id)];

        if (status) {
            conditions.push(eq(jobOffers.status, status));
        }

        const offersList = await db
            .select({
                offer: jobOffers,
                client: {
                    id: users.id,
                    firstName: users.firstName,
                    lastName: users.lastName,
                    email: users.email,
                    phone: users.phone,
                },
            })
            .from(jobOffers)
            .innerJoin(users, eq(jobOffers.clientId, users.id))
            .where(and(...conditions))
            .orderBy(desc(jobOffers.createdAt));

        return NextResponse.json({ offers: offersList });
    } catch (error) {
        console.error('Get offers error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch offers' },
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
        const {
            workerId,
            title,
            description,
            startDate,
            endDate,
            address,
            city,
            postalCode,
            country,
            serviceType,
            compensation,
            notes,
        } = body;

        // Validation
        if (!workerId || !title || !startDate || !endDate || !address || !city || !postalCode) {
            return NextResponse.json(
                { error: 'Worker ID, title, dates, and address are required' },
                { status: 400 }
            );
        }

        // Un utilisateur ne peut pas s'envoyer une offre à lui-même
        if (workerId === auth.user!.id) {
            return NextResponse.json(
                { error: 'You cannot send an offer to yourself' },
                { status: 400 }
            );
        }

        // Vérifier que le worker existe et a une profession (considéré comme travailleur)
        const [worker] = await db
            .select()
            .from(users)
            .where(eq(users.id, workerId))
            .limit(1);

        if (!worker) {
            return NextResponse.json(
                { error: 'Worker not found' },
                { status: 404 }
            );
        }

        if (!worker.profession) {
            return NextResponse.json(
                { error: 'Selected user is not a worker (no profession defined)' },
                { status: 400 }
            );
        }

        // Validation des dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            return NextResponse.json(
                { error: 'End date must be after start date' },
                { status: 400 }
            );
        }

        if (start < new Date()) {
            return NextResponse.json(
                { error: 'Start date cannot be in the past' },
                { status: 400 }
            );
        }

        // Créer l'offre
        const [newOffer] = await db
            .insert(jobOffers)
            .values({
                clientId: auth.user!.id,
                workerId,
                title,
                description: description || null,
                startDate: start,
                endDate: end,
                address,
                city,
                postalCode,
                country: country || 'France',
                serviceType: serviceType || null,
                compensation: compensation || null,
                notes: notes || null,
                status: 'pending',
            })
            .returning();

        return NextResponse.json({ offer: newOffer }, { status: 201 });
    } catch (error) {
        console.error('Create offer error:', error);
        return NextResponse.json(
            { error: 'Failed to create offer' },
            { status: 500 }
        );
    }
}

