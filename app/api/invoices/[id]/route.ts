// /app/api/invoices/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema';
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
        const [invoice] = await db
            .select()
            .from(invoices)
            .where(
                and(
                    eq(invoices.id, id),
                    eq(invoices.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        // Get invoice items
        const { invoiceItems } = await import('@/lib/db/schema');
        const items = await db
            .select()
            .from(invoiceItems)
            .where(eq(invoiceItems.invoiceId, id));

        return NextResponse.json({ invoice, items });
    } catch (error) {
        console.error('Get invoice error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch invoice' },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { issueDate, dueDate, subtotal, tax, total, status: invoiceStatus, notes, paidAt, paymentMethod } = body;

        // Check if invoice exists and belongs to user
        const [existingInvoice] = await db
            .select()
            .from(invoices)
            .where(
                and(
                    eq(invoices.id, id),
                    eq(invoices.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!existingInvoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        const updateData: Record<string, unknown> = {
            updatedAt: new Date(),
        };

        if (issueDate !== undefined) updateData.issueDate = new Date(issueDate);
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (subtotal !== undefined) updateData.subtotal = String(subtotal);
        if (tax !== undefined) updateData.tax = String(tax);
        if (total !== undefined) updateData.total = String(total);
        if (notes !== undefined) updateData.notes = notes;
        if (invoiceStatus !== undefined) {
            updateData.status = invoiceStatus;
            if (invoiceStatus === 'paid') {
                updateData.paidAt = paidAt ? new Date(paidAt) : new Date();
                updateData.paymentMethod = paymentMethod || null;
            }
        }

        const [updatedInvoice] = await db
            .update(invoices)
            .set(updateData)
            .where(eq(invoices.id, id))
            .returning();

        return NextResponse.json({ invoice: updatedInvoice });
    } catch (error) {
        console.error('Update invoice error:', error);
        return NextResponse.json(
            { error: 'Failed to update invoice' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success) {
            return NextResponse.json({ error: auth.error }, { status: 401 });
        }

        const { id } = await params;
        // Check if invoice exists and belongs to user
        const [existingInvoice] = await db
            .select()
            .from(invoices)
            .where(
                and(
                    eq(invoices.id, id),
                    eq(invoices.userId, auth.user!.id)
                )
            )
            .limit(1);

        if (!existingInvoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            );
        }

        await db
            .delete(invoices)
            .where(eq(invoices.id, id));

        return NextResponse.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Delete invoice error:', error);
        return NextResponse.json(
            { error: 'Failed to delete invoice' },
            { status: 500 }
        );
    }
}

