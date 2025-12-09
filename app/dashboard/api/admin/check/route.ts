// /app/dashboard/api/admin/check/route.ts
// Check if current user is an admin

import { NextRequest, NextResponse } from 'next/server'
import { authenticateAdminRequest } from '@/lib/utils/admin-auth-middleware'

export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateAdminRequest(req)

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: 401 }
            )
        }

        return NextResponse.json({
            isAdmin: true,
            admin: auth.admin
        })

    } catch (error) {
        console.error('Admin check error:', error)
        return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
    }
}

