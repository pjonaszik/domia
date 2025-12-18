import Redis from "ioredis";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { NextRequest, NextResponse } from "next/server";

// Validate env
if (!process.env.REDIS_HOST || !process.env.REDIS_PASSWORD) {
    console.error("⚠️ Redis credentials missing — rate limiting disabled");
}

//
// ──────────────────────────────────────────
//  Redis Client
// ──────────────────────────────────────────
//
export const redis = process.env.REDIS_HOST
    ? new Redis({
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT ?? "6379"),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        connectTimeout: 5000, // 5 second timeout
        retryStrategy(times) {
            // Stop retrying after 3 attempts
            if (times > 3) {
                console.error('⚠️ Redis connection failed after 3 attempts - disabling Redis features');
                return null; // Stop retrying
            }
            return Math.min(times * 200, 1000); // Exponential backoff
        },
        lazyConnect: true, // Don't connect immediately
    })
    : null;

// Handle Redis connection errors gracefully
if (redis) {
    redis.on('error', (err) => {
        console.error('⚠️ Redis connection error:', err.message);
    });
    
    redis.on('connect', () => {
        if (process.env.NODE_ENV === 'development') {
            console.log('✅ Redis connected successfully');
        }
    });
    
    // Try to connect (lazy connect)
    redis.connect().catch((err) => {
        console.error('⚠️ Failed to connect to Redis:', err.message);
        if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️  Continuing without Redis - caching and rate limiting disabled');
        }
    });
}

//
// ──────────────────────────────────────────
//  Rate Limiter Builder
// ──────────────────────────────────────────
//
function makeLimiter(points: number, durationSeconds: number, prefix: string) {
    if (!redis) return null;

    return new RateLimiterRedis({
        storeClient: redis,
        keyPrefix: prefix,
        points,
        duration: durationSeconds,
    });
}

//
// ──────────────────────────────────────────
//  All Your App Limiters (converted correctly)
// ──────────────────────────────────────────
//
export const rateLimiters = {
    auth: makeLimiter(20, 60, "rl:auth"),               // 20 / 1 min
    gameStart: makeLimiter(10, 300, "rl:game:start"),   // 10 / 5 min
    gameCheck: makeLimiter(60, 60, "rl:game:check"),    // 60 / 1 min
    gameEnd: makeLimiter(20, 300, "rl:game:end"),       // 20 / 5 min
    purchase: makeLimiter(30, 300, "rl:purchase"),      // 30 / 5 min
    purchaseStatus: makeLimiter(60, 60, "rl:purchase:status"),
    tonVerification: makeLimiter(20, 60, "rl:ton:verify"),
    tonTransactions: makeLimiter(30, 60, "rl:ton:transactions"),
    dailyBonusCheck: makeLimiter(60, 60, "rl:daily:check"),
    dailyBonusClaim: makeLimiter(10, 3600, "rl:daily:claim"), // 10 / 1h
    leaderboard: makeLimiter(120, 60, "rl:leaderboard"),
    referrals: makeLimiter(60, 60, "rl:referrals"),
    wallet: makeLimiter(20, 60, "rl:wallet"),
    paymentWallet: makeLimiter(20, 60, "rl:payment:wallet"),
    pointsHistory: makeLimiter(10, 3600, "rl:points:history"), // 10 requests per hour (on-demand pruning + caching)

    strict: makeLimiter(10, 3600, "rl:strict"), // suspicious user mode
    pointsRedeem: makeLimiter(5, 3600, "rl:redeem"), // 5 redemptions per hour
};

//
// ──────────────────────────────────────────
//  Helper: Check if Redis is ready to use
// ──────────────────────────────────────────
//
function isRedisReady(redisClient: Redis | null): boolean {
    if (!redisClient) return false;
    const status = redisClient.status;
    return status === 'ready' || status === 'connect';
}

async function ensureRedisConnection(redisClient: Redis | null): Promise<boolean> {
    if (!redisClient) return false;
    try {
        if (isRedisReady(redisClient)) {
            return true;
        }
        // Try to reconnect if connection is closed
        if (redisClient.status === 'end' || redisClient.status === 'close') {
            await redisClient.connect();
            return isRedisReady(redisClient);
        }
        return false;
    } catch (err) {
        console.warn('⚠️ Redis connection check failed:', err instanceof Error ? err.message : String(err));
        return false;
    }
}

//
// ──────────────────────────────────────────
//  Suspicious User Helpers
// ──────────────────────────────────────────
//
export async function checkAndFlagSuspiciousUser(userId: string, reason: string) {
    if (!redis) return;
    try {
        if (await ensureRedisConnection(redis)) {
            await redis.setex(`suspicious:${userId}`, 86400, reason);
        }
    } catch (err) {
        // Silently fail - suspicious user tracking is not critical
        console.warn("⚠️ Failed to flag suspicion:", err instanceof Error ? err.message : String(err));
    }
}

export async function isSuspiciousUser(userId: string): Promise<boolean> {
    if (!redis) return false;
    try {
        if (await ensureRedisConnection(redis)) {
            return (await redis.get(`suspicious:${userId}`)) !== null;
        }
        return false;
    } catch {
        return false;
    }
}

//
// ──────────────────────────────────────────
//  Rate Limiting Wrapper for Next.js API
// ──────────────────────────────────────────
//
export async function withRateLimit(
    req: NextRequest,
    limiter: RateLimiterRedis | null,
    opts: { useIp?: boolean; customIdentifier?: string; skipIfNoRedis?: boolean } = {}
) {
    if (!limiter) {
        if (opts.skipIfNoRedis !== false) {
            console.warn("⏭ Rate limit skipped (Redis offline)");
            return { headers: {} };
        }
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const identifier =
        opts.customIdentifier || getRateLimitIdentifier(req, opts.useIp);

    try {
        const res = await limiter.consume(identifier); // throws if denied

        return {
            headers: {
                "X-RateLimit-Limit": String(limiter.points),
                "X-RateLimit-Remaining": String(res.remainingPoints),
                "X-RateLimit-Reset": new Date(Date.now() + res.msBeforeNext).toISOString(),
            },
        };
    } catch (err: any) {
        const retry = Math.ceil(err.msBeforeNext / 1000);

        // Track repeated offenders
        if (redis) {
            try {
                if (await ensureRedisConnection(redis)) {
                    const bc = await redis.incr(`blocks:${identifier}`);
                    await redis.expire(`blocks:${identifier}`, 3600);
                    if (bc > 5) {
                        await checkAndFlagSuspiciousUser(identifier, `${bc} blocks in 1h`);
                    }
                }
            } catch (redisErr: unknown) {
                // Silently fail - block tracking is not critical
                console.warn('⚠️ Redis error during block tracking:', redisErr instanceof Error ? redisErr.message : String(redisErr));
            }
        }

        return NextResponse.json(
            { error: "Too many requests", retryAfter: retry },
            { status: 429, headers: { "Retry-After": retry.toString() } }
        );
    }
}

//
// ──────────────────────────────────────────
//  Identifier Extraction
// ──────────────────────────────────────────
//
function sanitizeIp(ip: string) {
    return ip.replace(/[^0-9a-f:\.]/gi, "").substring(0, 45);
}

export function getRateLimitIdentifier(req: NextRequest, useIp = false): string {
    if (useIp) {
        const ip =
            req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
            req.headers.get("x-real-ip") ||
            "unknown";
        return `ip:${sanitizeIp(ip)}`;
    }

    const initData = req.headers.get("X-Telegram-Init-Data");
    if (initData) {
        try {
            const params = new URLSearchParams(initData);
            const userData = params.get("user");
            if (userData) {
                const u = JSON.parse(userData);
                return `tg:${u.id}`;
            }
        } catch {}
    }

    // fallback to IP
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "unknown";

    return `ip:${sanitizeIp(ip)}`;
}

//
// ──────────────────────────────────────────
//  Suspicious User Dynamic Switch
// ──────────────────────────────────────────
//
export async function getAppropriateLimiter(
    defaultLimiter: RateLimiterRedis | null,
    userId?: string
) {
    if (!defaultLimiter) return null;
    if (userId && (await isSuspiciousUser(userId))) {
        return rateLimiters.strict;
    }
    return defaultLimiter;
}
