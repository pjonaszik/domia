// /lib/utils/request-timeout.ts
// Request timeout utilities for API routes

import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_TIMEOUT_MS = 30000 // 30 seconds default timeout

/**
 * Create a timeout promise that rejects after specified milliseconds
 */
function createTimeout(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Request timeout after ${timeoutMs}ms`))
        }, timeoutMs)
    })
}

/**
 * Wrap an async handler with a timeout
 * Usage:
 *   export async function POST(req: NextRequest) {
 *       return withTimeout(req, 30000, async () => {
 *           // Your handler code
 *       })
 *   }
 */
export async function withTimeout<T>(
    req: NextRequest,
    handler: () => Promise<NextResponse<T>>,
    timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<NextResponse<T>> {
    try {
        // Race between handler and timeout
        return await Promise.race([
            handler(),
            createTimeout(timeoutMs),
        ])
    } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes('timeout')) {
            console.error(`Request timeout after ${timeoutMs}ms:`, req.url)
            return NextResponse.json(
                { error: 'Request timeout - please try again' },
                { status: 504 }
            ) as NextResponse<T>
        }
        throw error
    }
}

/**
 * Get timeout configuration for different endpoint types
 */
export function getTimeoutForEndpoint(path: string): number {
    // Payment/verification endpoints
    if (path.includes('/verify-ton') || path.includes('/telegram-webhook')) {
        return 45000 // 45 seconds
    }

    // Database-heavy operations
    if (path.includes('/leaderboard') || path.includes('/history')) {
        return 20000 // 20 seconds
    }

    // Default timeout
    return DEFAULT_TIMEOUT_MS // 30 seconds
}

/**
 * Middleware wrapper that automatically applies timeout based on endpoint
 */
export function withAutoTimeout<T>(
    req: NextRequest,
    handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T>> {
    const timeout = getTimeoutForEndpoint(req.nextUrl.pathname)
    return withTimeout(req, handler, timeout)
}

