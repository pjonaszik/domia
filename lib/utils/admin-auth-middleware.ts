// /lib/utils/admin-auth-middleware.ts

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { admins } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { extractTokenFromHeader, verifyToken } from './auth';
import type { InferSelectModel } from 'drizzle-orm';

export type Admin = Omit<InferSelectModel<typeof admins>, 'passwordHash'>;

export interface AdminAuthResult {
    success: boolean;
    admin?: Admin;
    error?: string;
}

/**
 * Authenticate an admin request using JWT token
 */
export async function authenticateAdminRequest(req: NextRequest): Promise<AdminAuthResult> {
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

        // Fetch admin from database
        const adminList = await db.select().from(admins).where(eq(admins.id, payload.userId)).limit(1);

        if (!adminList || adminList.length === 0) {
            return {
                success: false,
                error: 'Admin not found'
            };
        }

        const admin = adminList[0];

        // Check if admin is active
        if (!admin.isActive) {
            return {
                success: false,
                error: 'Admin account is inactive'
            };
        }

        // Remove password hash from admin object
         
        const { passwordHash: _, ...adminWithoutPassword } = admin;

        return {
            success: true,
            admin: adminWithoutPassword
        };
    } catch (error) {
        console.error('Admin authentication error:', error);
        return {
            success: false,
            error: 'Authentication failed'
        };
    }
}

/**
 * Check if admin has specific permission
 */
export function hasPermission(admin: Admin, permission: string): boolean {
    if (!admin.permissions || typeof admin.permissions !== 'object') {
        return admin.role === 'super_admin'; // Super admins have all permissions
    }

    const permissions = admin.permissions as Record<string, boolean>;
    return permissions[permission] === true || admin.role === 'super_admin';
}

