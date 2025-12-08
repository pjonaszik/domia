// /middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import Redis from "ioredis"
import { RateLimiterRedis } from "rate-limiter-flexible"
import { getRequestId, addRequestIdToResponse } from './lib/utils/request-id'

// Initialize Redis (local VPS)
const redis = process.env.REDIS_HOST && process.env.REDIS_PASSWORD
    ? new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT ?? "6379"),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
    })
    : null

// Create rate limiters if Redis is available
const rateLimiters = redis ? {
    perMinute: new RateLimiterRedis({
        storeClient: redis,
        points: 2000,              // 2000 req
        duration: 60,              // per 1 min
        keyPrefix: "rl:ip:min",
    }),
    perSecond: new RateLimiterRedis({
        storeClient: redis,
        points: 100,               // 100 req
        duration: 1,               // per 1 sec
        keyPrefix: "rl:ip:sec",
    }),
} : null

function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const ip = forwarded?.split(',')[0]?.trim() || realIp || 'unknown'
    return ip.replace(/[^0-9a-f:\.]/gi, '').substring(0, 45);
}

export async function proxy(req: NextRequest) {
    try {
    // Only protect /api routes
    if (!req.nextUrl.pathname.startsWith("/api")) {
        return NextResponse.next()
    }

        // Generate and add request ID to all API requests
        const requestId = getRequestId(req)
        // Note: req.headers is read-only in Next.js, so we'll add it to the response instead


    if (!rateLimiters) {
        console.warn("⚠️ Redis not available — middleware rate limits disabled")
            const response = NextResponse.next()
            return addRequestIdToResponse(response, requestId)
    }

    const ip = getClientIp(req)

    try {
        // Check both per-second & per-minute
        await Promise.all([
            rateLimiters.perSecond.consume(ip),
            rateLimiters.perMinute.consume(ip)
        ])

            const response = NextResponse.next()
            return addRequestIdToResponse(response, requestId)
    } catch {
        // Rate limit exceeded
            const response = NextResponse.json(
            { error: "Rate limit exceeded" },
            { status: 429 }
        )
            return addRequestIdToResponse(response, requestId)
        }
    } catch (error) {
        // Catch any unexpected errors in the proxy function
        console.error('Proxy middleware error:', error)
        // Return a response to prevent the request from failing completely
        // Don't try to add request ID if there's an error, just pass through
        return NextResponse.next()
    }
}

export const config = {
    matcher: '/api/:path*'
}
