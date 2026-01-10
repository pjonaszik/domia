// /lib/utils/auth.ts

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT_SECRET is REQUIRED - fail fast if not set
const JWT_SECRET: string = process.env.JWT_SECRET || (() => {
    throw new Error('FATAL: JWT_SECRET environment variable is required. Application cannot start without it.');
})();

const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 12; // Increased from 10 (2026 security standard)

export interface JWTPayload {
    userId: string;
    email: string;
}

/**
 * Hash a password using bcrypt with 12 rounds (2026 security standard)
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions);
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    return parts[1];
}

