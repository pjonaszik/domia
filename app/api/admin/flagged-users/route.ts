// /app/api/admin/flagged-users/route.ts
// Admin endpoint to view users flagged for review (high abuse scores)

import { NextRequest, NextResponse } from 'next/server'
// abuses table removed - not needed for Domia
import { authenticateRequest } from '@/lib/utils/auth-middleware'
// Abuse detection removed - not needed for Domia
const ABUSE_THRESHOLDS = {
    FLAG_FOR_REVIEW: 50,
    TEMP_BAN_24H: 70,
    TEMP_BAN_72H: 85,
    PERMANENT_BAN: 100
}
// Audit logging removed - not needed for Domia
const logAdminAction = async () => {}
import { rateLimiters, withRateLimit } from '@/lib/utils/rate-limit'

// GET /api/admin/flagged-users - List users with high abuse scores
export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest(req)

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: 401 }
            )
        }

        const user = auth.user!

        // Check if user is admin
        if (!(user.isAdmin)) {
            return NextResponse.json(
                { error: 'Unauthorized - Admin only' },
                { status: 403 }
            )
        }

        // Rate limiting for admin endpoints
        const rateLimitResult = await withRateLimit(req, rateLimiters.admin, {
            customIdentifier: `admin:${user.id}`
        })

        if (rateLimitResult instanceof NextResponse) {
            return rateLimitResult
        }

        // Note: abuseScore field doesn't exist in Domia schema
        // This endpoint is kept for admin compatibility but returns empty list
        // Abuse detection system removed for Domia
        const usersWithLogs: unknown[] = []

        // Audit log
        await logAdminAction()

        return NextResponse.json({
            success: true,
            users: usersWithLogs,
            thresholds: ABUSE_THRESHOLDS
        })

    } catch (error) {
        console.error('Get flagged users error:', error)
        return NextResponse.json({ error: 'Failed to get flagged users' }, { status: 500 })
    }
}

