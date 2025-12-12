// /app/api/offers/[id]/accept/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobOffers, clients, appointments, workerClients, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

        // Vérifier que les dates ne sont pas passées
        if (new Date(offer.endDate) < new Date()) {
            return NextResponse.json(
                { error: 'Offer has expired' },
                { status: 400 }
            );
        }

        // Vérifier qu'il n'y a pas de chevauchement avec d'autres rendez-vous
        const overlappingAppointments = await db
            .select()
            .from(appointments)
            .where(
                and(
                    eq(appointments.userId, auth.user!.id),
                    eq(appointments.status, 'scheduled')
                )
            );

        const offerStart = new Date(offer.startDate);
        const offerEnd = new Date(offer.endDate);

        const hasOverlap = overlappingAppointments.some(apt => {
            const aptStart = new Date(apt.startTime);
            const aptEnd = new Date(apt.endTime);
            return (offerStart < aptEnd && offerEnd > aptStart);
        });

        if (hasOverlap) {
            return NextResponse.json(
                { error: 'This offer overlaps with an existing appointment' },
                { status: 400 }
            );
        }

        // Mettre à jour le statut de l'offre
        await db
            .update(jobOffers)
            .set({
                status: 'accepted',
                respondedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(eq(jobOffers.id, id));

        // Récupérer les informations du client expéditeur
        const [clientUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, offer.clientId))
            .limit(1);

        if (!clientUser) {
            return NextResponse.json(
                { error: 'Client user not found' },
                { status: 404 }
            );
        }

        // Vérifier si le client existe déjà dans la table clients du travailleur
        let existingClient = null;
        const existingClients = await db
            .select()
            .from(clients)
            .where(
                and(
                    eq(clients.userId, auth.user!.id),
                    eq(clients.email, clientUser.email || '')
                )
            )
            .limit(1);

        if (existingClients.length > 0) {
            existingClient = existingClients[0];
        } else {
            // Créer le client dans la table clients du travailleur
            const [newClient] = await db
                .insert(clients)
                .values({
                    userId: auth.user!.id,
                    firstName: clientUser.firstName || 'Client',
                    lastName: clientUser.lastName || '',
                    phone: clientUser.phone || null,
                    email: clientUser.email || null,
                    address: offer.address,
                    city: offer.city,
                    postalCode: offer.postalCode,
                    country: offer.country || 'France',
                    notes: `Client ajouté automatiquement via offre de mission: ${offer.title}`,
                })
                .returning();

            existingClient = newClient;
        }

        // Vérifier si la relation worker_clients existe déjà
        const existingRelation = await db
            .select()
            .from(workerClients)
            .where(
                and(
                    eq(workerClients.workerId, auth.user!.id),
                    eq(workerClients.clientId, offer.clientId)
                )
            )
            .limit(1);

        if (existingRelation.length === 0) {
            // Créer l'entrée dans worker_clients
            await db
                .insert(workerClients)
                .values({
                    workerId: auth.user!.id,
                    clientId: offer.clientId,
                    originalClientId: existingClient.id,
                });
        }

        // Calculer la durée en minutes
        const duration = Math.round((offerEnd.getTime() - offerStart.getTime()) / (1000 * 60));

        // Créer automatiquement un appointment dans le planning du travailleur
        const [newAppointment] = await db
            .insert(appointments)
            .values({
                userId: auth.user!.id,
                clientId: existingClient.id,
                startTime: offerStart,
                endTime: offerEnd,
                duration: duration,
                serviceName: offer.serviceType || offer.title,
                notes: `Créé automatiquement depuis l'offre: ${offer.title}${offer.notes ? '\n' + offer.notes : ''}`,
                status: 'scheduled',
                price: offer.compensation || null,
            })
            .returning();

        return NextResponse.json({
            success: true,
            offer: { ...offer, status: 'accepted' },
            appointment: newAppointment,
            client: existingClient,
        });
    } catch (error) {
        console.error('Accept offer error:', error);
        return NextResponse.json(
            { error: 'Failed to accept offer' },
            { status: 500 }
        );
    }
}

