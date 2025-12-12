// /lib/utils/structured-logging.ts
// Structured logging for security events and application monitoring

import { NextRequest } from 'next/server'
import { getRequestIdFromRequest } from './request-id'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'

export interface SecurityEvent {
    type: 'auth_failure' | 'auth_success' | 'rate_limit' | 'abuse_detected' | 'admin_action' | 'suspicious_activity' | 'payment_failure' | 'payment_success'
    severity: LogLevel
    userId?: string
    telegramId?: string
    ipAddress?: string
    userAgent?: string
    details?: Record<string, any>
    requestId?: string
    timestamp: Date
}

export interface ApplicationEvent {
    level: LogLevel
    message: string
    context?: Record<string, any>
    requestId?: string
    userId?: string
    timestamp: Date
    error?: Error
}

/**
 * Format log entry as JSON for structured logging
 */
function formatLogEntry(entry: SecurityEvent | ApplicationEvent): string {
    return JSON.stringify({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        environment: process.env.NODE_ENV,
    })
}

/**
 * Log a security event
 */
export async function logSecurityEvent(
    req: NextRequest | null,
    event: Omit<SecurityEvent, 'timestamp' | 'requestId' | 'ipAddress' | 'userAgent'>
): Promise<void> {
    try {
        const requestId = req ? getRequestIdFromRequest(req) : undefined
        const ipAddress = req
            ? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
              req.headers.get('x-real-ip') ||
              'unknown'
            : undefined
        const userAgent = req?.headers.get('user-agent') || undefined

        const securityEvent: SecurityEvent = {
            ...event,
            requestId,
            ipAddress,
            userAgent,
            timestamp: new Date(),
        }

        // Log to console in structured format
        const logMessage = formatLogEntry(securityEvent)
        
        switch (event.severity) {
            case 'critical':
            case 'error':
                console.error(`[SECURITY] ${logMessage}`)
                break
            case 'warn':
                console.warn(`[SECURITY] ${logMessage}`)
                break
            default:
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[SECURITY] ${logMessage}`)
                }
        }

        // In production, you might want to send to external logging service
        // Example: await sendToLoggingService(securityEvent)
        
    } catch (error) {
        // Don't fail the request if logging fails
        console.error('Failed to log security event:', error)
    }
}

/**
 * Log an application event
 */
export function logApplicationEvent(
    level: LogLevel,
    message: string,
    options: {
        req?: NextRequest | null
        context?: Record<string, any>
        userId?: string
        error?: Error
    } = {}
): void {
    try {
        const { req, context, userId, error } = options
        const requestId = req ? getRequestIdFromRequest(req) : undefined

        const appEvent: ApplicationEvent = {
            level,
            message,
            context,
            requestId,
            userId,
            timestamp: new Date(),
            error: error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } as any : undefined,
        }

        const logMessage = formatLogEntry(appEvent)

        switch (level) {
            case 'critical':
            case 'error':
                console.error(`[APP] ${logMessage}`)
                break
            case 'warn':
                console.warn(`[APP] ${logMessage}`)
                break
            case 'info':
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[APP] ${logMessage}`)
                }
                break
            case 'debug':
                if (process.env.NODE_ENV === 'development') {
                    console.log(`[APP] ${logMessage}`)
                }
                break
        }
    } catch (error) {
        // Don't fail if logging fails
        console.error('Failed to log application event:', error)
    }
}

/**
 * Convenience functions for common log levels
 */
export const logger = {
    debug: (message: string, options?: Parameters<typeof logApplicationEvent>[2]) =>
        logApplicationEvent('debug', message, options),
    info: (message: string, options?: Parameters<typeof logApplicationEvent>[2]) =>
        logApplicationEvent('info', message, options),
    warn: (message: string, options?: Parameters<typeof logApplicationEvent>[2]) =>
        logApplicationEvent('warn', message, options),
    error: (message: string, options?: Parameters<typeof logApplicationEvent>[2]) =>
        logApplicationEvent('error', message, options),
    critical: (message: string, options?: Parameters<typeof logApplicationEvent>[2]) =>
        logApplicationEvent('critical', message, options),
}

