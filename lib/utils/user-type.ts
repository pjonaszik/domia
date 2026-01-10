// /lib/utils/user-type.ts
// Utility functions to determine user type

/**
 * Check if a user is a company (legal entity)
 * A user is considered a company if they have NO profession (companies send missions, workers receive them)
 */
export function isCompany(user: { profession: string | null } | null | undefined): boolean {
    if (!user) return false;
    // Company = no profession defined
    return !user.profession;
}

/**
 * Check if a user is a physical person (worker)
 */
export function isWorker(user: { profession: string | null } | null | undefined): boolean {
    if (!user) return false;
    return !isCompany(user);
}
