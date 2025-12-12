// /app/api/pools/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { consultantPools } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { authenticateRequest } from '@/lib/utils/auth-middleware';
import { isCompany } from '@/lib/utils/user-type';

// PUT - Update a pool
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can update pools' }, { status: 403 });
        }

        const { id } = await params;
        
        // Security: Validate pool ID format
        if (!id || typeof id !== 'string' || id.length > 128) {
            return NextResponse.json({ error: 'Invalid pool ID' }, { status: 400 });
        }

        const body = await req.json();
        let { name, color } = body;
        const { description } = body;

        // Verify pool belongs to company
        const [existingPool] = await db
            .select()
            .from(consultantPools)
            .where(
                and(
                    eq(consultantPools.id, id),
                    eq(consultantPools.companyId, auth.user.id)
                )
            )
            .limit(1);

        if (!existingPool) {
            return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
        }

        const updateData: Record<string, any> = {
            updatedAt: new Date(),
        };

        if (name !== undefined) {
            if (typeof name !== 'string') {
                return NextResponse.json(
                    { error: 'Pool name must be a string' },
                    { status: 400 }
                );
            }
            name = name.trim();
            if (name.length === 0 || name.length > 255) {
                return NextResponse.json(
                    { error: 'Pool name must be between 1 and 255 characters' },
                    { status: 400 }
                );
            }
            updateData.name = name;
        }

        if (color !== undefined) {
            if (color === null) {
                updateData.color = null;
            } else if (typeof color === 'string') {
                color = color.trim().slice(0, 50);
                if (!/^#?[0-9A-Fa-f]{3,6}$|^[a-zA-Z]+$/.test(color)) {
                    return NextResponse.json(
                        { error: 'Invalid color format' },
                        { status: 400 }
                    );
                }
                updateData.color = color;
            } else {
                return NextResponse.json(
                    { error: 'Color must be a string or null' },
                    { status: 400 }
                );
            }
        }

        if (description !== undefined) {
            if (description === null) {
                updateData.description = null;
            } else if (typeof description === 'string') {
                updateData.description = description.trim().slice(0, 1000);
            } else {
                return NextResponse.json(
                    { error: 'Description must be a string or null' },
                    { status: 400 }
                );
            }
        }

        const [updatedPool] = await db
            .update(consultantPools)
            .set(updateData)
            .where(eq(consultantPools.id, id))
            .returning();

        return NextResponse.json({ pool: updatedPool });
    } catch (error) {
        console.error('Update pool error:', error);
        return NextResponse.json(
            { error: 'Failed to update pool' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a pool
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await authenticateRequest(req);
        if (!auth.success || !auth.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!isCompany(auth.user)) {
            return NextResponse.json({ error: 'Only companies can delete pools' }, { status: 403 });
        }

        const { id } = await params;

        // Verify pool belongs to company
        const [existingPool] = await db
            .select()
            .from(consultantPools)
            .where(
                and(
                    eq(consultantPools.id, id),
                    eq(consultantPools.companyId, auth.user.id)
                )
            )
            .limit(1);

        if (!existingPool) {
            return NextResponse.json({ error: 'Pool not found' }, { status: 404 });
        }

        // Delete pool (cascade will delete members)
        await db
            .delete(consultantPools)
            .where(eq(consultantPools.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete pool error:', error);
        return NextResponse.json(
            { error: 'Failed to delete pool' },
            { status: 500 }
        );
    }
}

