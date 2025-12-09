// /app/dashboard/api/settings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const [userSettings] = await db
            .select()
            .from(settings)
            .where(eq(settings.userId, auth.user!.id))
            .limit(1);

        if (!userSettings) {
            // Create default settings if they don't exist
            const [newSettings] = await db
                .insert(settings)
                .values({
                    userId: auth.user!.id,
                })
                .returning();

            return NextResponse.json({ settings: newSettings });
        }

        return NextResponse.json({ settings: userSettings });
    } catch (error) {
        console.error('Get settings error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await req.json();
        const {
            emailNotifications,
            smsNotifications,
            reminderBeforeAppointment,
            defaultServiceDuration,
            workingHours,
            currency,
            taxRate,
            preferences,
            sepaIban,
            sepaBic,
            sepaAccountHolder,
        } = body;

        // Check if settings exist
        const [existingSettings] = await db
            .select()
            .from(settings)
            .where(eq(settings.userId, auth.user!.id))
            .limit(1);

        if (!existingSettings) {
            // Create new settings
            const [newSettings] = await db
                .insert(settings)
                .values({
                    userId: auth.user!.id,
                    emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
                    smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
                    reminderBeforeAppointment: reminderBeforeAppointment || 30,
                    defaultServiceDuration: defaultServiceDuration || 60,
                    workingHours: workingHours || null,
                    currency: currency || 'EUR',
                    taxRate: taxRate || '0.00',
                    preferences: preferences || null,
                })
                .returning();

            return NextResponse.json({ settings: newSettings }, { status: 201 });
        }

        // Update existing settings
        const updateData: any = {
            updatedAt: new Date(),
        };

        if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
        if (smsNotifications !== undefined) updateData.smsNotifications = smsNotifications;
        if (reminderBeforeAppointment !== undefined) updateData.reminderBeforeAppointment = reminderBeforeAppointment;
        if (defaultServiceDuration !== undefined) updateData.defaultServiceDuration = defaultServiceDuration;
        if (workingHours !== undefined) updateData.workingHours = workingHours;
        if (currency !== undefined) updateData.currency = currency;
        if (taxRate !== undefined) updateData.taxRate = taxRate;
        if (preferences !== undefined) updateData.preferences = preferences;

        // Handle SEPA payment info in preferences
        if (sepaIban !== undefined || sepaBic !== undefined || sepaAccountHolder !== undefined) {
            const currentPreferences = existingSettings.preferences as any || {};
            updateData.preferences = {
                ...currentPreferences,
                sepaPayment: {
                    iban: sepaIban !== undefined ? sepaIban : currentPreferences.sepaPayment?.iban || null,
                    bic: sepaBic !== undefined ? sepaBic : currentPreferences.sepaPayment?.bic || null,
                    accountHolder: sepaAccountHolder !== undefined ? sepaAccountHolder : currentPreferences.sepaPayment?.accountHolder || null,
                },
            };
        }

        const [updatedSettings] = await db
            .update(settings)
            .set(updateData)
            .where(eq(settings.userId, auth.user!.id))
            .returning();

        return NextResponse.json({ settings: updatedSettings });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        );
    }
}

