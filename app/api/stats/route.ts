// /app/api/stats/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, invoices, clients } from '@/lib/db/schema';
import { eq, and, gte, lte, count } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const userId = auth.user!.id;

        // Date range
        const start = startDate ? new Date(startDate) : new Date();
        start.setMonth(start.getMonth() - 1); // Default to last month
        const end = endDate ? new Date(endDate) : new Date();

        // Total clients
        const [clientCount] = await db
            .select({ count: count() })
            .from(clients)
            .where(eq(clients.userId, userId));

        // Appointments stats
        const appointmentsInRange = await db
            .select()
            .from(appointments)
            .where(
                and(
                    eq(appointments.userId, userId),
                    gte(appointments.startTime, start),
                    lte(appointments.startTime, end)
                )
            );

        const totalAppointments = appointmentsInRange.length;
        const completedAppointments = appointmentsInRange.filter(a => a.status === 'completed').length;
        const cancelledAppointments = appointmentsInRange.filter(a => a.status === 'cancelled').length;

        // Revenue stats
        const invoicesInRange = await db
            .select()
            .from(invoices)
            .where(
                and(
                    eq(invoices.userId, userId),
                    gte(invoices.issueDate, start),
                    lte(invoices.issueDate, end)
                )
            );

        const totalRevenue = invoicesInRange
            .filter(i => i.status === 'paid')
            .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

        const pendingRevenue = invoicesInRange
            .filter(i => i.status === 'sent')
            .reduce((sum, inv) => sum + parseFloat(inv.total || '0'), 0);

        return NextResponse.json({
            stats: {
                clients: {
                    total: clientCount.count,
                },
                appointments: {
                    total: totalAppointments,
                    completed: completedAppointments,
                    cancelled: cancelledAppointments,
                    completionRate: totalAppointments > 0 ? (completedAppointments / totalAppointments) * 100 : 0,
                },
                revenue: {
                    total: totalRevenue,
                    pending: pendingRevenue,
                    invoices: {
                        total: invoicesInRange.length,
                        paid: invoicesInRange.filter(i => i.status === 'paid').length,
                        pending: invoicesInRange.filter(i => i.status === 'sent').length,
                    },
                },
                period: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                },
            },
        });
    } catch (error) {
        console.error('Get stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch statistics' },
            { status: 500 }
        );
    }
}

