// /app/api/offers/[id]/accept/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobOffers, clients, appointments, workerClients, users } from '@/lib/db/schema';
import { eq, and, or } from 'drizzle-orm';
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

        // Vérifier qu'il reste des postes disponibles pour cette mission
        // Toutes les offres de la même mission ont le même numberOfPositions
        // On compte combien d'offres de cette mission ont déjà été acceptées
        const missionOffers = await db
            .select()
            .from(jobOffers)
            .where(
                and(
                    eq(jobOffers.clientId, offer.clientId),
                    eq(jobOffers.title, offer.title),
                    eq(jobOffers.startDate, offer.startDate),
                    eq(jobOffers.endDate, offer.endDate),
                    eq(jobOffers.address, offer.address)
                )
            );

        // Count offers that are accepted, in_progress, or completed (any status except pending/declined/expired)
        const acceptedCount = missionOffers.filter(o => 
            o.status === 'accepted' || 
            o.status === 'in_progress' || 
            o.status === 'completed_pending_validation' || 
            o.status === 'needs_correction' || 
            o.status === 'completed_validated'
        ).length;
        const numberOfPositions = offer.numberOfPositions || 1;

        if (acceptedCount >= numberOfPositions) {
            return NextResponse.json(
                { error: 'All positions for this mission have been filled' },
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

        // Vérifier qu'il n'y a pas de chevauchement avec d'autres rendez-vous ou missions
        // Minimum 30 minutes entre les missions/appointments
        const MINIMUM_GAP_MINUTES = 30;
        const MINIMUM_GAP_MS = MINIMUM_GAP_MINUTES * 60 * 1000;

        const offerStart = new Date(offer.startDate);
        const offerEnd = new Date(offer.endDate);
        // Ajouter 30 minutes avant et après pour vérifier le gap
        const offerStartWithGap = new Date(offerStart.getTime() - MINIMUM_GAP_MS);
        const offerEndWithGap = new Date(offerEnd.getTime() + MINIMUM_GAP_MS);

        // Vérifier les appointments existants
        const overlappingAppointments = await db
            .select()
            .from(appointments)
            .where(
                and(
                    eq(appointments.userId, auth.user!.id),
                    eq(appointments.status, 'scheduled')
                )
            );

        const hasAppointmentOverlap = overlappingAppointments.some(apt => {
            const aptStart = new Date(apt.startTime);
            const aptEnd = new Date(apt.endTime);
            // Vérifier le chevauchement avec le gap de 30 minutes
            return (offerStartWithGap < aptEnd && offerEndWithGap > aptStart);
        });

        if (hasAppointmentOverlap) {
            return NextResponse.json(
                { error: 'This offer overlaps with an existing appointment or has less than 30 minutes gap' },
                { status: 400 }
            );
        }

        // Vérifier les missions acceptées/en cours du même travailleur
        const existingMissions = await db
            .select()
            .from(jobOffers)
            .where(
                and(
                    eq(jobOffers.workerId, auth.user!.id),
                    // Inclure seulement les missions acceptées/en cours
                    or(
                        eq(jobOffers.status, 'accepted'),
                        eq(jobOffers.status, 'in_progress'),
                        eq(jobOffers.status, 'completed_pending_validation'),
                        eq(jobOffers.status, 'needs_correction'),
                        eq(jobOffers.status, 'completed_validated')
                    )
                )
            );

        const hasMissionOverlap = existingMissions.some(existingOffer => {
            // Ignorer l'offre actuelle
            if (existingOffer.id === offer.id) {
                return false;
            }
            
            // Ignorer les offres pending, declined, expired
            if (existingOffer.status === 'pending' || 
                existingOffer.status === 'declined' || 
                existingOffer.status === 'expired') {
                return false;
            }

            const existingStart = new Date(existingOffer.startDate);
            const existingEnd = new Date(existingOffer.endDate);
            
            // Vérifier le chevauchement avec le gap de 30 minutes
            return (offerStartWithGap < existingEnd && offerEndWithGap > existingStart);
        });

        if (hasMissionOverlap) {
            return NextResponse.json(
                { error: 'This offer overlaps with an existing mission or has less than 30 minutes gap' },
                { status: 400 }
            );
        }

        // Mettre à jour le statut de l'offre à 'in_progress'
        await db
            .update(jobOffers)
            .set({
                status: 'in_progress',
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
            // Extract first and last name from businessName for client record
            const businessName = clientUser.businessName || 'Client';
            const nameParts = businessName.split(' ');
            const firstName = nameParts[0] || 'Client';
            const lastName = nameParts.slice(1).join(' ') || '';

            const [newClient] = await db
                .insert(clients)
                .values({
                    userId: auth.user!.id,
                    firstName,
                    lastName,
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
                notes: offer.notes || null,
                status: 'scheduled',
                price: offer.compensation || null,
            })
            .returning();

        return NextResponse.json({
            success: true,
            offer: { ...offer, status: 'in_progress' },
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

