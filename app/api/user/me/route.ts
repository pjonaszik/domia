// /app/api/user/me/route.ts
// Get current authenticated user data

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

        // Return full user data
        return NextResponse.json({
            user: auth.user
        })

    } catch (error) {
        console.error('Get user error:', error)
        return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 })
    }
}

