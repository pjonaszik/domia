// /app/api/auth/logout/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function POST(_req: NextRequest) {
    // Logout is handled client-side by removing the token
    // This endpoint can be used for server-side cleanup if needed
    return NextResponse.json({ message: 'Logged out successfully' });
}

