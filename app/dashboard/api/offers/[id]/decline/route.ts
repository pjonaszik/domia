// /app/dashboard/api/offers/[id]/decline/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobOffers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;

        // Récupérer l'offre
        const [offer] = await db
            .select()
            .from(jobOffers)
            .where(eq(jobOffers.id, id))
            .limit(1);

        if (!offer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Vérifier que l'utilisateur est le travailleur destinataire
        if (offer.workerId !== auth.user!.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        // Vérifier que le statut est 'pending'
        if (offer.status !== 'pending') {
            return NextResponse.json(
                { error: 'Offer has already been responded to' },
                { status: 400 }
            );
        }

        // Mettre à jour le statut à 'declined'
        const [updatedOffer] = await db
            .update(jobOffers)
            .set({
                status: 'declined',
                respondedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(jobOffers.id, id))
            .returning();

        return NextResponse.json({
            success: true,
            offer: updatedOffer,
        });
    } catch (error) {
        console.error('Decline offer error:', error);
        return NextResponse.json(
            { error: 'Failed to decline offer' },
            { status: 500 }
        );
    }
}

