// /app/api/offers/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobOffers, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;

        const [offerData] = await db
            .select({
                offer: jobOffers,
                client: {
                    id: users.id,
                    businessName: users.businessName,
                    email: users.email,
                    phone: users.phone,
                    address: users.address,
                    city: users.city,
                    postalCode: users.postalCode,
                },
            })
            .from(jobOffers)
            .innerJoin(users, eq(jobOffers.clientId, users.id))
            .where(eq(jobOffers.id, id))
            .limit(1);

        if (!offerData) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Vérifier que l'utilisateur est le destinataire ou l'expéditeur
        if (offerData.offer.workerId !== auth.user!.id && offerData.offer.clientId !== auth.user!.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        return NextResponse.json({ offer: offerData });
    } catch (error) {
        console.error('Get offer error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch offer' },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();

        // Vérifier que l'offre existe et que l'utilisateur a le droit de la modifier
        const [existingOffer] = await db
            .select()
            .from(jobOffers)
            .where(eq(jobOffers.id, id))
            .limit(1);

        if (!existingOffer) {
            return NextResponse.json(
                { error: 'Offer not found' },
                { status: 404 }
            );
        }

        // Seul le client expéditeur peut modifier l'offre (avant acceptation)
        if (existingOffer.clientId !== auth.user!.id) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        if (existingOffer.status !== 'pending') {
            return NextResponse.json(
                { error: 'Cannot modify offer that has been responded to' },
                { status: 400 }
            );
        }

        // Mettre à jour l'offre
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (body.title !== undefined) updateData.title = body.title;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
        if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);
        if (body.address !== undefined) updateData.address = body.address;
        if (body.city !== undefined) updateData.city = body.city;
        if (body.postalCode !== undefined) updateData.postalCode = body.postalCode;
        if (body.country !== undefined) updateData.country = body.country;
        if (body.serviceType !== undefined) updateData.serviceType = body.serviceType;
        if (body.compensation !== undefined) updateData.compensation = body.compensation;
        if (body.notes !== undefined) updateData.notes = body.notes;

        const [updatedOffer] = await db
            .update(jobOffers)
            .set(updateData)
            .where(eq(jobOffers.id, id))
            .returning();

        return NextResponse.json({ offer: updatedOffer });
    } catch (error) {
        console.error('Update offer error:', error);
        return NextResponse.json(
            { error: 'Failed to update offer' },
            { status: 500 }
        );
    }
}

