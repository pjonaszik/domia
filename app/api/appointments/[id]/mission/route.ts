// /app/api/appointments/[id]/mission/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, jobOffers, users, clients } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
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

        // Récupérer l'appointment
        const [appointment] = await db
            .select()
            .from(appointments)
            .where(
                and(
                    eq(appointments.id, id),
                    eq(appointments.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!appointment) {
            return NextResponse.json(
                { error: 'Appointment not found' },
                { status: 404 }
            );
        }

        // Récupérer le client pour obtenir le clientId original
        const [client] = await db
            .select()
            .from(clients)
            .where(eq(clients.id, appointment.clientId))
            .limit(1);

        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Chercher la mission (jobOffer) qui correspond à cet appointment
        // En utilisant les dates (avec une tolérance) et le workerId
        // On cherche les missions où les dates correspondent (même si les heures peuvent différer légèrement)
        const appointmentStart = new Date(appointment.startTime)
        const appointmentEnd = new Date(appointment.endTime)
        
        // Récupérer toutes les missions du worker pour trouver celle qui correspond
        const allMissions = await db
            .select({
                id: jobOffers.id,
                title: jobOffers.title,
                description: jobOffers.description,
                startDate: jobOffers.startDate,
                endDate: jobOffers.endDate,
                address: jobOffers.address,
                city: jobOffers.city,
                postalCode: jobOffers.postalCode,
                country: jobOffers.country,
                serviceType: jobOffers.serviceType,
                compensation: jobOffers.compensation,
                notes: jobOffers.notes,
                status: jobOffers.status,
                hoursPerDay: jobOffers.hoursPerDay,
                numberOfPositions: jobOffers.numberOfPositions,
                clientId: jobOffers.clientId,
            })
            .from(jobOffers)
            .where(eq(jobOffers.workerId, auth.user!.id))
            .limit(100); // Limiter pour éviter trop de résultats

        // Trouver la mission qui correspond aux dates de l'appointment
        const mission = allMissions.find(m => {
            const missionStart = new Date(m.startDate)
            const missionEnd = new Date(m.endDate)
            // Vérifier si les dates correspondent (tolérance de 1 minute)
            return Math.abs(missionStart.getTime() - appointmentStart.getTime()) < 60000 &&
                   Math.abs(missionEnd.getTime() - appointmentEnd.getTime()) < 60000
        });

        if (!mission) {
            return NextResponse.json(
                { error: 'Mission not found for this appointment' },
                { status: 404 }
            );
        }

        // Vérifier que le travailleur a accepté cette mission (status in_progress, completed_pending_validation, needs_correction, completed_validated)
        // Les détails sensibles (adresse, notes) ne doivent être visibles que pour les missions acceptées
        const allowedStatuses = ['in_progress', 'completed_pending_validation', 'needs_correction', 'completed_validated']
        if (!allowedStatuses.includes(mission.status)) {
            return NextResponse.json(
                { error: 'Mission details are only available for accepted missions' },
                { status: 403 }
            );
        }

        // Récupérer les informations du client
        const [clientUser] = await db
            .select({
                id: users.id,
                firstName: users.firstName,
                lastName: users.lastName,
                email: users.email,
                phone: users.phone,
            })
            .from(users)
            .where(eq(users.id, mission.clientId))
            .limit(1);

        if (!mission || !clientUser) {
            return NextResponse.json(
                { error: 'Mission not found for this appointment' },
                { status: 404 }
            );
        }

        return NextResponse.json({ 
            mission: {
                ...mission,
                client: clientUser,
            }
        });
    } catch (error) {
        console.error('Get mission from appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mission' },
            { status: 500 }
        );
    }
}

