// /app/api/missions/hours/route.ts
// Get hours worked for all offers in a mission (grouped by title, dates, address)

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { missionHours, jobOffers, users, settings } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is a company (has no profession = company)
        const userIsCompany = !auth.user.profession;
        if (!userIsCompany) {
            return NextResponse.json({ error: 'Only companies can view mission hours' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const title = searchParams.get('title');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const address = searchParams.get('address');

        if (!title || !startDate || !endDate || !address) {
            return NextResponse.json(
                { error: 'Title, startDate, endDate, and address are required' },
                { status: 400 }
            );
        }

        // Get all offers for this mission
        const missionOffers = await db
            .select({
                id: jobOffers.id,
                workerId: jobOffers.workerId,
                status: jobOffers.status,
            })
            .from(jobOffers)
            .where(
                and(
                    eq(jobOffers.clientId, auth.user.id),
                    eq(jobOffers.title, title),
                    eq(jobOffers.startDate, new Date(startDate)),
                    eq(jobOffers.endDate, new Date(endDate)),
                    eq(jobOffers.address, address)
                )
            );

        if (missionOffers.length === 0) {
            return NextResponse.json({ hours: [] });
        }

        const offerIds = missionOffers.map(o => o.id);

        // Get hours for all offers in this mission with consultant info and SEPA
        const hoursData = await db
            .select({
                id: missionHours.id,
                offerId: missionHours.offerId,
                hoursWorked: missionHours.hoursWorked,
                status: missionHours.status,
                rejectionNote: missionHours.rejectionNote,
                validatedAt: missionHours.validatedAt,
                createdAt: missionHours.createdAt,
                updatedAt: missionHours.updatedAt,
                worker: {
                    id: users.id,
                    businessName: users.businessName,
                    email: users.email,
                },
            })
            .from(missionHours)
            .innerJoin(users, eq(missionHours.workerId, users.id))
            .where(inArray(missionHours.offerId, offerIds));

        // Get SEPA info for each consultant
        const hoursWithSepa = await Promise.all(
            hoursData.map(async (hour) => {
                const [userSettings] = await db
                    .select()
                    .from(settings)
                    .where(eq(settings.userId, hour.worker.id))
                    .limit(1);

                const preferences = userSettings?.preferences as { sepaPayment?: { iban?: string | null; bic?: string | null } } | null;
                const sepaPayment = preferences?.sepaPayment || null;

                return {
                    ...hour,
                    sepaPayment: sepaPayment ? {
                        iban: sepaPayment.iban || null,
                        bic: sepaPayment.bic || null,
                    } : null,
                };
            })
        );

        return NextResponse.json({ hours: hoursWithSepa });
    } catch (error) {
        console.error('Get mission hours error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mission hours' },
            { status: 500 }
        );
    }
}

