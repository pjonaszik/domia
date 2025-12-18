import { db } from '@/lib/db';
import { jobOffers, missionHours, settings, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

type MissionHoursStatus = 'pending_validation' | 'needs_correction' | 'validated';

export async function getOfferHoursWithWorkerAndSepa(offerId: string) {
    const rows = await db
        .select({
            id: missionHours.id,
            offerId: missionHours.offerId,
            hoursWorked: missionHours.hoursWorked,
            status: missionHours.status,
            rejectionNote: missionHours.rejectionNote,
            validatedAt: missionHours.validatedAt,
            createdAt: missionHours.createdAt,
            updatedAt: missionHours.updatedAt,
            workerId: users.id,
            workerFirstName: users.firstName,
            workerLastName: users.lastName,
            workerEmail: users.email,
            settingsPreferences: settings.preferences,
        })
        .from(missionHours)
        .innerJoin(users, eq(missionHours.workerId, users.id))
        .leftJoin(settings, eq(settings.userId, users.id))
        .where(eq(missionHours.offerId, offerId));

    return rows.map((r) => {
        const prefs = (r.settingsPreferences ?? null) as { sepaPayment?: { iban?: string | null; bic?: string | null } } | null;
        const sepa = prefs?.sepaPayment ?? null;

        return {
            id: r.id,
            offerId: r.offerId,
            hoursWorked: r.hoursWorked,
            status: r.status as MissionHoursStatus,
            rejectionNote: r.rejectionNote,
            validatedAt: r.validatedAt,
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
            worker: {
                id: r.workerId,
                firstName: r.workerFirstName,
                lastName: r.workerLastName,
                email: r.workerEmail,
            },
            sepaPayment: sepa
                ? {
                      iban: sepa.iban ?? null,
                      bic: sepa.bic ?? null,
                  }
                : null,
        };
    });
}

export async function validateOfferHours(params: {
    companyId: string;
    offerId: string;
    hoursId: string;
    action: 'validate' | 'reject';
    rejectionNote?: string | null;
}) {
    const { companyId, offerId, hoursId, action, rejectionNote } = params;

    const [hours] = await db.select().from(missionHours).where(eq(missionHours.id, hoursId)).limit(1);
    if (!hours) {
        return { ok: false as const, status: 404 as const, error: 'Hours not found' };
    }

    // Important: ensure route offerId matches the hours.offerId (prevents cross-offer validation by mistake)
    if (hours.offerId !== offerId) {
        return { ok: false as const, status: 400 as const, error: 'Hours do not belong to this offer' };
    }

    const [offer] = await db.select().from(jobOffers).where(and(eq(jobOffers.id, offerId), eq(jobOffers.clientId, companyId))).limit(1);
    if (!offer) {
        return { ok: false as const, status: 403 as const, error: 'Unauthorized' };
    }

    if (hours.status !== 'pending_validation' && hours.status !== 'needs_correction') {
        return { ok: false as const, status: 400 as const, error: 'Hours are not in a valid state for validation' };
    }

    if (action === 'reject') {
        if (!rejectionNote || typeof rejectionNote !== 'string' || rejectionNote.trim().length === 0) {
            return { ok: false as const, status: 400 as const, error: 'Rejection note is required when rejecting hours' };
        }

        await db
            .update(missionHours)
            .set({
                status: 'needs_correction',
                rejectionNote: rejectionNote.trim(),
                updatedAt: new Date(),
            })
            .where(eq(missionHours.id, hoursId));

        await db
            .update(jobOffers)
            .set({
                status: 'needs_correction',
                updatedAt: new Date(),
            })
            .where(eq(jobOffers.id, offerId));

        return { ok: true as const };
    }

    await db
        .update(missionHours)
        .set({
            status: 'validated',
            validatedAt: new Date(),
            validatedBy: companyId,
            updatedAt: new Date(),
        })
        .where(eq(missionHours.id, hoursId));

    await db
        .update(jobOffers)
        .set({
            status: 'completed_validated',
            updatedAt: new Date(),
        })
        .where(eq(jobOffers.id, offerId));

    return { ok: true as const };
}


