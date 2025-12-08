// /app/api/admin/check/route.ts
// Check if current user is an admin

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/utils/auth-middleware'

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

        return NextResponse.json({
            isAdmin: user.isAdmin || false
        })

    } catch (error) {
        console.error('Admin check error:', error)
        return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
    }
}

