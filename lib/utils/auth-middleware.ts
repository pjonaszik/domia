// /lib/utils/auth-middleware.ts

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { extractTokenFromHeader, verifyToken } from './auth';
import type { InferSelectModel } from 'drizzle-orm';

export type User = Omit<InferSelectModel<typeof users>, 'passwordHash'>;

export interface AuthResult {
    success: boolean;
    user?: User;
    error?: string;
}

/**
 * Check if user is admin
 */
export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const [user] = await db
            .select({ isAdmin: users.isAdmin })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);
        
        return user?.isAdmin || false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

/**
 * Authenticate a request using JWT token
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
    try {
        const authHeader = req.headers.get('authorization');
        const token = extractTokenFromHeader(authHeader);

        if (!token) {
            return {
                success: false,
                error: 'No authentication token provided'
            };
        }

        const payload = verifyToken(token);
        if (!payload) {
            return {
                success: false,
                error: 'Invalid or expired token'
            };
        }

        // Fetch user from database
        const user = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);

        if (!user || user.length === 0) {
            return {
                success: false,
                error: 'User not found'
            };
        }

        // Remove password hash from user object
         
        const { passwordHash: _, ...userWithoutPassword } = user[0];

        return {
            success: true,
            user: userWithoutPassword
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return {
            success: false,
            error: 'Authentication failed'
        };
    }
}

