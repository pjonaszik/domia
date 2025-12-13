// /app/api/missions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jobOffers, consultantPools, consultantPoolMembers, users } from '@/lib/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

// GET - List all missions created by the company
export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can view missions' }, { status: 403 });
        }

        // Get all job offers created by this company
        // Group by title, startDate, endDate to get unique missions
        const allOffers = await db
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
                workerId: jobOffers.workerId,
                createdAt: jobOffers.createdAt,
            })
            .from(jobOffers)
            .where(eq(jobOffers.clientId, auth.user.id))
            .orderBy(desc(jobOffers.createdAt));

        // Group offers by mission (same title, startDate, endDate, address)
        const missionsMap = new Map<string, {
            title: string
            description: string | null
            startDate: Date
            endDate: Date
            address: string
            city: string
            postalCode: string
            country: string | null
            serviceType: string | null
            compensation: string | null
            notes: string | null
            createdAt: Date
            totalOffers: number
            pendingCount: number
            acceptedCount: number
            declinedCount: number
            inProgressCount: number
            completedPendingValidationCount: number
            needsCorrectionCount: number
            completedValidatedCount: number
            consultantIds: string[]
        }>()

        for (const offer of allOffers) {
            const missionKey = `${offer.title}|${offer.startDate.toISOString()}|${offer.endDate.toISOString()}|${offer.address}`
            
            if (!missionsMap.has(missionKey)) {
                missionsMap.set(missionKey, {
                    title: offer.title,
                    description: offer.description,
                    startDate: offer.startDate,
                    endDate: offer.endDate,
                    address: offer.address,
                    city: offer.city,
                    postalCode: offer.postalCode,
                    country: offer.country,
                    serviceType: offer.serviceType,
                    compensation: offer.compensation,
                    notes: offer.notes,
                    createdAt: offer.createdAt,
                    totalOffers: 0,
                    pendingCount: 0,
                    acceptedCount: 0,
                    declinedCount: 0,
                    inProgressCount: 0,
                    completedPendingValidationCount: 0,
                    needsCorrectionCount: 0,
                    completedValidatedCount: 0,
                    consultantIds: [],
                })
            }

            const mission = missionsMap.get(missionKey)!
            mission.totalOffers++
            if (!mission.consultantIds.includes(offer.workerId)) {
                mission.consultantIds.push(offer.workerId)
            }
            
            if (offer.status === 'pending') {
                mission.pendingCount++
            } else if (offer.status === 'accepted') {
                mission.acceptedCount++
            } else if (offer.status === 'declined') {
                mission.declinedCount++
            } else if (offer.status === 'in_progress') {
                mission.inProgressCount++
            } else if (offer.status === 'completed_pending_validation') {
                mission.completedPendingValidationCount++
            } else if (offer.status === 'needs_correction') {
                mission.needsCorrectionCount++
            } else if (offer.status === 'completed_validated') {
                mission.completedValidatedCount++
            }
        }

        const missions = Array.from(missionsMap.values()).map(mission => ({
            ...mission,
            consultantsNotified: mission.consultantIds.length,
        }))

        return NextResponse.json({ missions });
    } catch (error) {
        console.error('Get missions error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch missions' },
            { status: 500 }
        );
    }
}

// POST - Create a mission and send offers to consultants in selected pools
export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can create missions' }, { status: 403 });
        }

        const body = await req.json();
        const {
            title,
            description,
            startDate,
            endDate,
            address,
            city,
            postalCode,
            country,
            serviceType,
            hourlyRate, // Required hourly rate specified by company
            numberOfPositions, // Number of positions available
            notes,
            poolIds, // Array of pool IDs to assign the mission to
        } = body;

        // Validate required fields
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
            return NextResponse.json(
                { error: 'Title is required' },
                { status: 400 }
            );
        }

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Start date and end date are required' },
                { status: 400 }
            );
        }

        if (!address || typeof address !== 'string' || address.trim().length === 0) {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        if (!city || typeof city !== 'string' || city.trim().length === 0) {
            return NextResponse.json(
                { error: 'City is required' },
                { status: 400 }
            );
        }

        if (!postalCode || typeof postalCode !== 'string' || postalCode.trim().length === 0) {
            return NextResponse.json(
                { error: 'Postal code is required' },
                { status: 400 }
            );
        }

        if (!poolIds || !Array.isArray(poolIds) || poolIds.length === 0) {
            return NextResponse.json(
                { error: 'At least one pool must be selected' },
                { status: 400 }
            );
        }

        if (!hourlyRate || isNaN(parseFloat(hourlyRate.toString())) || parseFloat(hourlyRate.toString()) <= 0) {
            return NextResponse.json(
                { error: 'Hourly rate is required and must be greater than 0' },
                { status: 400 }
            );
        }

        if (!numberOfPositions || isNaN(parseInt(numberOfPositions.toString())) || parseInt(numberOfPositions.toString()) <= 0) {
            return NextResponse.json(
                { error: 'Number of positions is required and must be greater than 0' },
                { status: 400 }
            );
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return NextResponse.json(
                { error: 'Invalid date format' },
                { status: 400 }
            );
        }

        if (start >= end) {
            return NextResponse.json(
                { error: 'End date must be after start date' },
                { status: 400 }
            );
        }

        // Check that company has at least one pool with at least one consultant
        const companyPools = await db
            .select({ id: consultantPools.id })
            .from(consultantPools)
            .where(eq(consultantPools.companyId, auth.user.id));

        if (companyPools.length === 0) {
            return NextResponse.json(
                { error: 'You must have at least one pool to create a mission' },
                { status: 400 }
            );
        }

        // Verify all selected pools belong to the company
        const validPoolIds = companyPools.map(p => p.id);
        const invalidPools = poolIds.filter((id: string) => !validPoolIds.includes(id));
        if (invalidPools.length > 0) {
            return NextResponse.json(
                { error: 'One or more selected pools do not belong to your company' },
                { status: 403 }
            );
        }

        // Get all consultants from selected pools with their hourly rates
        const poolMembers = await db
            .select({ 
                consultantId: consultantPoolMembers.consultantId,
                hourlyRate: users.hourlyRate,
            })
            .from(consultantPoolMembers)
            .innerJoin(users, eq(consultantPoolMembers.consultantId, users.id))
            .where(inArray(consultantPoolMembers.poolId, poolIds));

        // Remove duplicates (consultants can be in multiple pools)
        const uniqueConsultants = poolMembers.reduce((acc, member) => {
            if (!acc.find(c => c.consultantId === member.consultantId)) {
                acc.push(member);
            }
            return acc;
        }, [] as typeof poolMembers);

        if (uniqueConsultants.length === 0) {
            return NextResponse.json(
                { error: 'Selected pools have no consultants. Please add consultants to your pools first.' },
                { status: 400 }
            );
        }

        // Calculate number of days
        const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
        const hourlyRateNum = parseFloat(hourlyRate.toString());

        // Create job offers for all consultants with calculated compensation
        // auth.user is guaranteed to exist at this point due to the check above
        const offers = uniqueConsultants.map(consultant => {
            // Calculate compensation: hourlyRate * number of days
            const compensation = hourlyRateNum * daysDiff;
            const calculatedCompensation = compensation.toFixed(2);

            return {
                clientId: auth.user!.id,
                workerId: consultant.consultantId,
                title: title.trim(),
                description: description?.trim() || null,
                startDate: start,
                endDate: end,
                address: address.trim(),
                city: city.trim(),
                postalCode: postalCode.trim(),
                country: country?.trim() || 'France',
                serviceType: serviceType?.trim() || null,
                hoursPerDay: null, // No longer used, kept for backward compatibility
                compensation: calculatedCompensation,
                notes: notes?.trim() || null,
                numberOfPositions: parseInt(numberOfPositions.toString()),
                status: 'pending',
            };
        });

        const createdOffers = await db
            .insert(jobOffers)
            .values(offers)
            .returning();

        return NextResponse.json({
            success: true,
            mission: {
                title,
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            offersCreated: createdOffers.length,
            consultantsNotified: uniqueConsultants.length,
        }, { status: 201 });
    } catch (error) {
        console.error('Create mission error:', error);
        return NextResponse.json(
            { error: 'Failed to create mission' },
            { status: 500 }
        );
    }
}
