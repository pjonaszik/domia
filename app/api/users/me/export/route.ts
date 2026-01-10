// /app/api/users/me/export/route.ts
// RGPD Article 20: Right to data portability
// Export all personal data for the authenticated user

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { db } from '@/lib/db';
import { users, clients, appointments, jobOffers, missionHours, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = auth.user.id;

        // Fetch all personal data in parallel
        const [
            userData,
            userClients,
            userAppointments,
            sentOffers,
            receivedOffers,
            userMissionHours,
            userSettings,
        ] = await Promise.all([
            // User profile
            db.select().from(users).where(eq(users.id, userId)).limit(1),
            
            // Clients created by user
            db.select().from(clients).where(eq(clients.userId, userId)),
            
            // Appointments
            db.select().from(appointments).where(eq(appointments.userId, userId)),
            
            // Job offers sent by user (as company)
            db.select().from(jobOffers).where(eq(jobOffers.clientId, userId)),
            
            // Job offers received by user (as worker)
            db.select().from(jobOffers).where(eq(jobOffers.workerId, userId)),
            
            // Mission hours submitted by user
            db.select().from(missionHours).where(eq(missionHours.workerId, userId)),
            
            // User settings
            db.select().from(settings).where(eq(settings.userId, userId)).limit(1),
        ]);

        // Remove sensitive fields (passwordHash)
        const user = userData[0];
        if (user) {
            const { passwordHash: _, ...userWithoutPassword } = user;
            
            // Build RGPD export
            const exportData = {
                exportDate: new Date().toISOString(),
                exportFormat: 'JSON',
                dataSubject: {
                    userId: user.id,
                    email: user.email,
                },
                personalData: {
                    profile: userWithoutPassword,
                    clients: userClients,
                    appointments: userAppointments,
                    sentOffers,
                    receivedOffers,
                    missionHours: userMissionHours,
                    settings: userSettings[0] || null,
                },
                metadata: {
                    totalClients: userClients.length,
                    totalAppointments: userAppointments.length,
                    totalSentOffers: sentOffers.length,
                    totalReceivedOffers: receivedOffers.length,
                    totalMissionHours: userMissionHours.length,
                },
            };

            // Set headers for file download
            const filename = `domia-export-${userId}-${Date.now()}.json`;
            
            return new NextResponse(JSON.stringify(exportData, null, 2), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                    'Cache-Control': 'no-store',
                },
            });
        }

        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } catch (error) {
        console.error('Export user data error:', error);
        return NextResponse.json(
            { error: 'Failed to export user data' },
            { status: 500 }
        );
    }
}

