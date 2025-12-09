// /app/dashboard/api/admin/flagged-users/route.ts
// Admin endpoint to view users flagged for review

import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdminRequest } from '@/lib/utils/admin-auth-middleware'
import { rateLimiters, withRateLimit } from '@/lib/utils/rate-limit'

// GET /dashboard/api/admin/flagged-users - List users flagged for review
export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateAdminRequest(req)

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: 401 }
            )
        }

        const admin = auth.admin!

        // Rate limiting for admin endpoints
        const rateLimitResult = await withRateLimit(req, rateLimiters.admin, {
            customIdentifier: `admin:${admin.id}`
        })

        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult
        }

        // Note: abuseScore field doesn't exist in Domia schema
        // This endpoint is kept for admin compatibility but returns empty list
        // Abuse detection system removed for Domia
        const usersWithLogs: unknown[] = []

        return NextResponse.json({
            success: true,
            users: usersWithLogs
        })

    } catch (error) {
        console.error('Get flagged users error:', error)
        return NextResponse.json({ error: 'Failed to get flagged users' }, { status: 500 })
    }
}

