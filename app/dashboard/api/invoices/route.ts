// /app/api/invoices/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, clients } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const clientId = searchParams.get('clientId');
        const status = searchParams.get('status');

        // Build conditions
        const conditions = [eq(invoices.userId, auth.user!.id)];

        if (clientId) {
            conditions.push(eq(invoices.clientId, clientId));
        }

        if (status) {
            conditions.push(eq(invoices.status, status));
        }

        const invoiceList = await db
            .select()
            .from(invoices)
            .where(and(...conditions))
            .orderBy(desc(invoices.issueDate));

        return NextResponse.json({ invoices: invoiceList });
    } catch (error) {
        console.error('Get invoices error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const body = await req.json();
        const { clientId, issueDate, dueDate, subtotal, tax, total, notes, items } = body;

        if (!clientId || !issueDate || !subtotal || !total) {
            return NextResponse.json(
                { error: 'Client ID, issue date, subtotal, and total are required' },
                { status: 400 }
            );
        }

        // Verify client belongs to user
        const [client] = await db
            .select()
            .from(clients)
            .where(
                and(
                    eq(clients.id, clientId),
                    eq(clients.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            );
        }

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        const [newInvoice] = await db
            .insert(invoices)
            .values({
                userId: auth.user!.id,
                clientId,
                invoiceNumber,
                issueDate: new Date(issueDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                subtotal: String(subtotal),
                tax: tax ? String(tax) : '0.00',
                total: String(total),
                notes: notes || null,
            })
            .returning();

        // Create invoice items if provided
        if (items && Array.isArray(items) && items.length > 0) {
            const { invoiceItems } = await import('@/lib/db/schema');
            for (const item of items) {
                await db.insert(invoiceItems).values({
                    invoiceId: newInvoice.id,
                    appointmentId: item.appointmentId || null,
                    description: item.description,
                    quantity: String(item.quantity || 1),
                    unitPrice: String(item.unitPrice),
                    total: String(item.total || item.unitPrice * (item.quantity || 1)),
                });
            }
        }

        return NextResponse.json({ invoice: newInvoice }, { status: 201 });
    } catch (error) {
        console.error('Create invoice error:', error);
        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        );
    }
}

