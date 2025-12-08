// /lib/utils/request-id.ts
// Request ID middleware for tracing requests across services

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

const REQUEST_ID_HEADER = 'X-Request-ID'

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
    // Use crypto.randomUUID() if available (Node 14.17+), otherwise fallback to randomBytes
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    // Fallback for older Node versions
    return crypto.randomBytes(16).toString('hex')
}

/**
 * Get request ID from request headers or generate a new one
 */
export function getRequestId(req: NextRequest): string {
    // Check if already in headers (from client or previous middleware)
    const existingId = req.headers.get(REQUEST_ID_HEADER)
    if (existingId) {
        return existingId
    }

    // Generate new ID
    return generateRequestId()
}

/**
 * Add request ID to response headers
 */
export function addRequestIdToResponse(
    response: NextResponse,
    requestId: string
): NextResponse {
    response.headers.set(REQUEST_ID_HEADER, requestId)
    return response
}

/**
 * Middleware to add request ID to all requests
 * Usage: Add to middleware.ts
 */
export function withRequestId(
    req: NextRequest,
    handler: (req: NextRequest, requestId: string) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> | NextResponse {
    const requestId = getRequestId(req)
    
    // Add to request headers for downstream use
    req.headers.set(REQUEST_ID_HEADER, requestId)
    
    // Call handler with request ID
    const response = handler(req, requestId)
    
    // Add to response headers
    if (response instanceof Promise) {
        return response.then(res => addRequestIdToResponse(res, requestId))
    }
    
    return addRequestIdToResponse(response, requestId)
}

/**
 * Get request ID from request (for use in API routes)
 */
export function getRequestIdFromRequest(req: NextRequest): string {
    return req.headers.get(REQUEST_ID_HEADER) || generateRequestId()
}

