// /app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateToken } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, firstName, lastName, profession } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (existingUser.length > 0) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
                email,
                passwordHash,
                firstName: firstName || null,
                lastName: lastName || null,
                profession: profession || null,
            })
            .returning();

        // Remove password hash from response
        const { passwordHash: _, ...userWithoutPassword } = newUser;

        // Generate token
        const token = generateToken({
            userId: newUser.id,
            email: newUser.email,
        });

        return NextResponse.json(
            {
                user: userWithoutPassword,
                token,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Failed to register user' },
            { status: 500 }
        );
    }
}

