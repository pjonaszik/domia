// /lib/utils/validation.ts
// Input validation utilities for security

/**
 * Validate and sanitize string input
 */
export function validateString(
    value: any,
    options: {
        required?: boolean
        maxLength?: number
        minLength?: number
        pattern?: RegExp
        trim?: boolean
    } = {}
): { valid: boolean; value?: string; error?: string } {
    const { required = false, maxLength = 1000, minLength = 0, pattern, trim = true } = options

    // Check if required
    if (required && (value === undefined || value === null || value === '')) {
        return { valid: false, error: 'Field is required' }
    }

    // If not required and empty, return valid
    if (!required && (value === undefined || value === null || value === '')) {
        return { valid: true, value: '' }
    }

    // Convert to string
    let str = String(value)

    // Trim if requested
    if (trim) {
        str = str.trim()
    }

    // Check length
    if (str.length < minLength) {
        return { valid: false, error: `Must be at least ${minLength} characters` }
    }

    if (str.length > maxLength) {
        return { valid: false, error: `Must be at most ${maxLength} characters` }
    }

    // Check pattern if provided
    if (pattern && !pattern.test(str)) {
        return { valid: false, error: 'Invalid format' }
    }

    return { valid: true, value: str }
}

/**
 * Validate and parse integer
 */
export function validateInteger(
    value: any,
    options: {
        required?: boolean
        min?: number
        max?: number
        default?: number
    } = {}
): { valid: boolean; value?: number; error?: string } {
    const { required = false, min, max, default: defaultValue } = options

    // Check if required
    if (required && (value === undefined || value === null || value === '')) {
        return { valid: false, error: 'Field is required' }
    }

    // Use default if not provided and not required
    if (!required && (value === undefined || value === null || value === '')) {
        if (defaultValue !== undefined) {
            return { valid: true, value: defaultValue }
        }
        return { valid: true, value: undefined }
    }

    // Parse integer
    const parsed = parseInt(String(value), 10)

    // Check if valid number
    if (isNaN(parsed)) {
        return { valid: false, error: 'Must be a valid number' }
    }

    // Check bounds
    if (min !== undefined && parsed < min) {
        return { valid: false, error: `Must be at least ${min}` }
    }

    if (max !== undefined && parsed > max) {
        return { valid: false, error: `Must be at most ${max}` }
    }

    return { valid: true, value: parsed }
}

/**
 * Validate date string
 */
export function validateDate(
    value: any,
    options: {
        required?: boolean
        minDate?: Date
        maxDate?: Date
    } = {}
): { valid: boolean; value?: Date; error?: string } {
    const { required = false, minDate, maxDate } = options

    // Check if required
    if (required && (value === undefined || value === null || value === '')) {
        return { valid: false, error: 'Date is required' }
    }

    // If not required and empty, return valid
    if (!required && (value === undefined || value === null || value === '')) {
        return { valid: true, value: undefined }
    }

    // Parse date
    const date = new Date(value)

    // Check if valid date
    if (isNaN(date.getTime())) {
        return { valid: false, error: 'Invalid date format' }
    }

    // Check min date
    if (minDate && date < minDate) {
        return { valid: false, error: `Date must be after ${minDate.toISOString()}` }
    }

    // Check max date
    if (maxDate && date > maxDate) {
        return { valid: false, error: `Date must be before ${maxDate.toISOString()}` }
    }

    return { valid: true, value: date }
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string, maxLength: number = 100): string {
    if (!query) return ''
    return query.trim().substring(0, maxLength).replace(/[<>]/g, '')
}

/**
 * Safely parse JSON from request body with size limit and error handling
 */
export async function safeJsonParse<T = unknown>(
    req: Request,
    maxSize: number = 1024 * 1024 // 1MB default
): Promise<{ success: true; data: T } | { success: false; error: string; status: number }> {
    try {
        // Check Content-Type
        const contentType = req.headers.get('content-type')
        if (contentType && !contentType.includes('application/json')) {
            return {
                success: false,
                error: 'Content-Type must be application/json',
                status: 400
            }
        }

        // Get content length
        const contentLength = req.headers.get('content-length')
        if (contentLength) {
            const size = parseInt(contentLength, 10)
            if (size > maxSize) {
                return {
                    success: false,
                    error: `Request body too large. Maximum size: ${Math.floor(maxSize / 1024)}KB`,
                    status: 413
                }
            }
        }

        // Parse JSON with timeout protection
        const text = await req.text()
        
        // Check actual size
        if (text.length > maxSize) {
            return {
                success: false,
                error: `Request body too large. Maximum size: ${Math.floor(maxSize / 1024)}KB`,
                status: 413
            }
        }

        const data = JSON.parse(text) as T
        return { success: true, data }
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            return {
                success: false,
                error: 'Invalid JSON in request body',
                status: 400
            }
        }
        return {
            success: false,
            error: 'Failed to parse request body',
            status: 400
        }
    }
}

/**
 * Sanitize error messages for production (hide sensitive details)
 */
export function sanitizeError(error: unknown, isProduction: boolean = process.env.NODE_ENV === 'production'): string {
    if (!isProduction) {
        // In development, show full error
        if (error instanceof Error) {
            return error.message || String(error) || 'Unknown error'
        }
        return String(error) || 'Unknown error'
    }

    // In production, return generic messages
    if (error instanceof Error && 'code' in error && error.code === '23505') {
        return 'Duplicate entry detected'
    }
    if (error instanceof Error && 'code' in error && error.code === '23503') {
        return 'Invalid reference'
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23502') {
        return 'Required field missing'
    }
    if (typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' && error.code.startsWith('23')) {
        return 'Database constraint violation'
    }
    if (typeof error === 'object' && error !== null && 'code' in error && (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED')) {
        return 'Service temporarily unavailable'
    }

    // Generic error for unknown cases
    return 'An error occurred. Please try again later.'
}

/**
 * Validate battle creation/update data
 */
export interface BattleData {
    name: string
    team1: string
    team2: string
    eventDate: string
    sport?: string
    league?: string
    potAmount: number
}

export function validateBattleData(data: unknown): { valid: boolean; data?: BattleData; error?: string } {
    // Type guard: ensure data is an object
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Invalid data format' }
    }
    
    const dataObj = data as Record<string, unknown>
    
    // Validate name (optional - will be auto-generated as "team1 vs team2" if not provided)
    const nameValidation = validateString(dataObj.name, {
        required: false,
        maxLength: 200,
        minLength: 1
    })
    if (!nameValidation.valid) {
        return { valid: false, error: `Name: ${nameValidation.error}` }
    }

    // Validate team1
    const team1Validation = validateString(dataObj.team1, {
        required: true,
        maxLength: 100,
        minLength: 1
    })
    if (!team1Validation.valid) {
        return { valid: false, error: `Team 1: ${team1Validation.error}` }
    }

    // Validate team2
    const team2Validation = validateString(dataObj.team2, {
        required: true,
        maxLength: 100,
        minLength: 1
    })
    if (!team2Validation.valid) {
        return { valid: false, error: `Team 2: ${team2Validation.error}` }
    }

    // Validate eventDate
    // Accept ISO string (preferred, in UTC) or datetime-local format, convert to Date
    let eventDate: Date
    if (typeof dataObj.eventDate === 'string') {
        // If it's already an ISO string with Z (UTC), parse it directly
        if (dataObj.eventDate.includes('T') && dataObj.eventDate.includes('Z')) {
            eventDate = new Date(dataObj.eventDate)
        } else if (dataObj.eventDate.includes('T')) {
            // datetime-local format (YYYY-MM-DDTHH:mm) - parse as local time
            // new Date() automatically interprets it as local time, which is correct
            eventDate = new Date(dataObj.eventDate)
        } else {
            // Try parsing as-is (fallback)
            eventDate = new Date(dataObj.eventDate)
        }
    } else if (dataObj.eventDate instanceof Date) {
        eventDate = dataObj.eventDate
    } else {
        return { valid: false, error: 'Event Date: Invalid date format' }
    }

    // Validate the date
    const dateValidation = validateDate(eventDate, {
        required: true,
        minDate: new Date() // Event must be in the future
    })
    if (!dateValidation.valid) {
        return { valid: false, error: `Event Date: ${dateValidation.error}` }
    }

    // Validate sport (required)
    const sportValidation = validateString(dataObj.sport, {
        required: true,
        maxLength: 50
    })
    if (!sportValidation.valid) {
        return { valid: false, error: `Sport: ${sportValidation.error}` }
    }

    // Validate league (required)
    const leagueValidation = validateString(dataObj.league, {
        required: true,
        maxLength: 50
    })
    if (!leagueValidation.valid) {
        return { valid: false, error: `League: ${leagueValidation.error}` }
    }

    // Validate potAmount
    const potAmountValidation = validateInteger(dataObj.potAmount, {
        required: true,
        min: 1,
        max: 1000000 // Max 1 million points
    })
    if (!potAmountValidation.valid) {
        return { valid: false, error: `Pot Amount: ${potAmountValidation.error}` }
    }

    // Auto-generate name if not provided
    const battleName = nameValidation.value || `${team1Validation.value!} vs ${team2Validation.value!}`
    
    // Ensure eventDate is in UTC ISO format
    const eventDateUTC = eventDate.toISOString()
    
    return {
        valid: true,
        data: {
            name: battleName,
            team1: team1Validation.value!,
            team2: team2Validation.value!,
            eventDate: eventDateUTC,
            sport: sportValidation.value!,
            league: leagueValidation.value!,
            potAmount: potAmountValidation.value!
        }
    }
}
