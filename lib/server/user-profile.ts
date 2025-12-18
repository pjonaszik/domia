import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function parseOptionalRate(value: unknown): string | null {
    if (value === null || value === undefined || value === '') return null;

    const num = typeof value === 'number' ? value : parseFloat(String(value));
    if (!Number.isFinite(num) || num < 0) {
        throw new Error('Invalid hourly rate. Must be a positive number.');
    }

    // Keep scale=2 expectation (db is decimal scale 2); store as string to match schema usage.
    return num.toFixed(2);
}

export async function updateUserHourlyRate(userId: string, hourlyRate: unknown) {
    const rate = parseOptionalRate(hourlyRate);

    const [updatedUser] = await db
        .update(users)
        .set({
            hourlyRate: rate,
            updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
}


