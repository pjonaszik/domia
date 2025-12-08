// /lib/utils/invoice-generator.ts

import type { Invoice, InvoiceItem, Client, User } from '@/lib/db/schema';

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9).toUpperCase();
    return `INV-${timestamp}-${random}`;
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(items: Array<{ quantity: number; unitPrice: number }>, taxRate: number = 0): {
    subtotal: number;
    tax: number;
    total: number;
} {
    const subtotal = items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
    }, 0);

    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        total: Math.round(total * 100) / 100,
    };
}

/**
 * Format currency
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
    }).format(amount);
}

/**
 * Generate invoice data for PDF generation
 */
export function prepareInvoiceData(
    invoice: Invoice,
    items: InvoiceItem[],
    client: Client,
    user: User
): {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string | null;
    client: {
        name: string;
        address: string;
    };
    professional: {
        name: string;
        address: string;
        siret?: string;
    };
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        total: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
} {
    const clientName = `${client.firstName} ${client.lastName}`;
    const clientAddress = `${client.address}, ${client.postalCode} ${client.city}`;

    const professionalName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const professionalAddress = user.address
        ? `${user.address}, ${user.postalCode || ''} ${user.city || ''}`.trim()
        : '';

    const formattedItems = items.map(item => ({
        description: item.description,
        quantity: parseFloat(item.quantity || '1'),
        unitPrice: parseFloat(item.unitPrice || '0'),
        total: parseFloat(item.total || '0'),
    }));

    const { subtotal, tax, total } = calculateInvoiceTotals(
        formattedItems,
        parseFloat(invoice.tax || '0')
    );

    return {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate.toISOString().split('T')[0],
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString().split('T')[0] : null,
        client: {
            name: clientName,
            address: clientAddress,
        },
        professional: {
            name: professionalName,
            address: professionalAddress,
            siret: user.siret || undefined,
        },
        items: formattedItems,
        subtotal,
        tax,
        total,
    };
}

/**
 * Generate invoice PDF (placeholder - in production, use @react-pdf/renderer or similar)
 */
export async function generateInvoicePDF(
    _invoice: Invoice,
    _items: InvoiceItem[],
    _client: Client,
    _user: User
): Promise<Buffer | null> {
    // TODO: Implement PDF generation using @react-pdf/renderer or similar library
    // This is a placeholder
    console.warn('PDF generation not implemented - using placeholder');
    return null;
}

