// /app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateToken } from '@/lib/utils/auth';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password, businessName, profession, businessId, phone, country } = body;

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

        // Validate business name
        if (!businessName || businessName.trim().length === 0) {
            return NextResponse.json(
                { error: 'Business name is required' },
                { status: 400 }
            );
        }

        if (businessName.trim().length > 255) {
            return NextResponse.json(
                { error: 'Business name is too long (max 255 characters)' },
                { status: 400 }
            );
        }

        // Validate business ID
        if (!businessId) {
            return NextResponse.json(
                { error: 'Business ID is required' },
                { status: 400 }
            );
        }

        // Simple validation: alphanumeric, uppercase, allowing hyphens
        const businessIdCleaned = businessId.replace(/\s/g, '').toUpperCase()
        if (businessIdCleaned.length < 3 || businessIdCleaned.length > 50) {
            return NextResponse.json(
                { error: 'Invalid business ID format' },
                { status: 400 }
            );
        }
        // Alphanumeric and hyphens only
        if (!/^[A-Z0-9-]+$/.test(businessIdCleaned)) {
            return NextResponse.json(
                { error: 'Business ID must contain only alphanumeric characters and hyphens' },
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

        // Format phone (remove spaces)
        const phoneCleaned = phone ? phone.replace(/\s/g, '') : null;

        // Create user
        const [newUser] = await db
            .insert(users)
            .values({
                email,
                passwordHash,
                businessName: businessName.trim(),
                profession: profession || null,
                businessId: businessIdCleaned || null,
                phone: phoneCleaned || null,
                country: country || 'France',
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
        // Sanitize error for production (don't expose stack traces)
        const isProduction = process.env.NODE_ENV === 'production';
        if (isProduction) {
            console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
        } else {
            console.error('Registration error:', error);
        }
        return NextResponse.json(
            { error: 'Failed to register user' },
            { status: 500 }
        );
    }
}

