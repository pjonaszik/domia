// /lib/db/index.ts

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { logApplicationEvent } from '@/lib/utils/structured-logging';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

// Create a connection pool with monitoring
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Connection pool configuration
    connectionTimeoutMillis: 10000, // 10 seconds
    max: 10, // Maximum number of connections
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    allowExitOnIdle: false, // Keep pool alive
});

// Monitor pool events
pool.on('connect', () => {
    logApplicationEvent('debug', 'Database client connected', {
        context: {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
            waitingCount: pool.waitingCount,
        },
    });
});

pool.on('error', (err) => {
    logApplicationEvent('error', 'Database pool error', {
        context: {
            error: err.message,
            code: err instanceof Error && 'code' in err ? String(err.code) : undefined,
        },
        error: err,
    });
});

pool.on('remove', () => {
    logApplicationEvent('debug', 'Database client removed', {
        context: {
            totalCount: pool.totalCount,
            idleCount: pool.idleCount,
        },
    });
});

// Monitor pool health periodically (in production)
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        const poolStats = {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount,
        };

        // Log warning if pool is getting full
        if (poolStats.total >= 8) {
            logApplicationEvent('warn', 'Database pool usage high', {
                context: poolStats,
            });
        }

        // Log critical if pool is exhausted
        if (poolStats.waiting > 0) {
            logApplicationEvent('error', 'Database pool exhausted - clients waiting', {
                context: poolStats,
            });
        }
    }, 60000); // Check every minute
}

/**
 * Get current pool statistics
 */
export function getPoolStats() {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        active: pool.totalCount - pool.idleCount,
        waiting: pool.waitingCount,
    };
}

export const db = drizzle(pool);