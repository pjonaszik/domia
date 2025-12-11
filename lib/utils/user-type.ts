// /lib/utils/user-type.ts
// Utility functions to determine user type

/**
 * Check if a user is a company (legal entity)
 * A user is considered a company if firstName is null and lastName exists
 * (as per registration logic: for legal entities, firstName is null and lastName contains company name)
 */
export function isCompany(user: { firstName: string | null; lastName: string | null } | null | undefined): boolean {
    if (!user) return false
    return user.firstName === null && user.lastName !== null && user.lastName !== ''
}

/**
 * Check if a user is a physical person (worker)
 */
export function isWorker(user: { firstName: string | null; lastName: string | null } | null | undefined): boolean {
    if (!user) return false
    return !isCompany(user)
}

