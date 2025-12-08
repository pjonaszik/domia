// /app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateToken } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Find user
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        // Don't reveal if user exists or not (security best practice)
        if (!user) {
            return NextResponse.json({
                message: 'If an account exists with this email, a password reset link has been sent.',
            });
        }

        // Generate reset token (valid for 1 hour)
        const resetToken = generateToken({
            userId: user.id,
            email: user.email,
        });

        // TODO: Send email with reset link
        // For now, we'll just return a message
        // In production, you would:
        // 1. Store reset token in database with expiration
        // 2. Send email with reset link containing the token

        return NextResponse.json({
            message: 'If an account exists with this email, a password reset link has been sent.',
            // In development, you might want to return the token for testing
            // Remove this in production!
            ...(process.env.NODE_ENV === 'development' && { resetToken }),
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Failed to process password reset request' },
            { status: 500 }
        );
    }
}

