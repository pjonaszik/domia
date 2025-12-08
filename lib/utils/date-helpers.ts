// /lib/utils/date-helpers.ts

import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, isSameDay, isToday, isTomorrow, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale/fr';

/**
 * Format date for display
 */
export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy', useLocale: boolean = false): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, useLocale ? { locale: fr } : undefined);
}

/**
 * Format time for display
 */
export function formatTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'HH:mm');
}

/**
 * Format date and time for display
 */
export function formatDateTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: fr });
}

/**
 * Get relative date string (today, tomorrow, yesterday, or formatted date)
 */
export function getRelativeDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (isToday(dateObj)) {
        return "Aujourd'hui";
    }
    if (isTomorrow(dateObj)) {
        return 'Demain';
    }
    if (isYesterday(dateObj)) {
        return 'Hier';
    }
    
    return formatDate(dateObj, 'EEEE d MMMM', true);
}

/**
 * Get start and end of day
 */
export function getDayRange(date: Date | string): { start: Date; end: Date } {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
        start: startOfDay(dateObj),
        end: endOfDay(dateObj),
    };
}

/**
 * Get start and end of week
 */
export function getWeekRange(date: Date | string): { start: Date; end: Date } {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
        start: startOfWeek(dateObj, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(dateObj, { weekStartsOn: 1 }),
    };
}

/**
 * Get start and end of month
 */
export function getMonthRange(date: Date | string): { start: Date; end: Date } {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return {
        start: startOfMonth(dateObj),
        end: endOfMonth(dateObj),
    };
}

/**
 * Add days to date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addDays(dateObj, days);
}

/**
 * Add weeks to date
 */
export function addWeeksToDate(date: Date | string, weeks: number): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addWeeks(dateObj, weeks);
}

/**
 * Add months to date
 */
export function addMonthsToDate(date: Date | string, months: number): Date {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return addMonths(dateObj, months);
}

/**
 * Check if two dates are the same day
 */
export function isSameDate(date1: Date | string, date2: Date | string): boolean {
    const date1Obj = typeof date1 === 'string' ? parseISO(date1) : date1;
    const date2Obj = typeof date2 === 'string' ? parseISO(date2) : date2;
    return isSameDay(date1Obj, date2Obj);
}

