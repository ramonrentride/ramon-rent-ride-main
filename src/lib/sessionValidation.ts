/**
 * Session validation utilities for booking
 * Prevents booking morning sessions when it's already past the session time
 */

// Morning session ends at 14:00 (2 PM)
const MORNING_SESSION_END_HOUR = 14;
// Daily session - can book until end of day
const DAILY_SESSION_BUFFER_HOURS = 2;

/**
 * Check if a session is available for booking on a given date
 * @param date - The booking date (YYYY-MM-DD format)
 * @param session - The session type ('morning' or 'daily')
 * @returns Object with isAvailable boolean and reason string
 */
export function isSessionAvailableForDate(
  date: string,
  session: 'morning' | 'daily'
): { isAvailable: boolean; reason?: string } {
  const now = new Date();
  const bookingDate = new Date(date);

  // Set both dates to midnight for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const bookingDay = new Date(bookingDate.getFullYear(), bookingDate.getMonth(), bookingDate.getDate());

  // If booking for future date, all sessions are available
  if (bookingDay > today) {
    return { isAvailable: true };
  }

  // If booking for today, check current time in Israel
  if (bookingDay.getTime() === today.getTime()) {
    // Get current time in Israel
    const israelTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' });
    const currentHour = new Date(israelTime).getHours();

    if (session === 'morning') {
      // Morning session (07:00-14:00) - can't book if it's past 10:00 AM (too late to start)
      if (currentHour >= 10) {
        return {
          isAvailable: false,
          reason: 'morningSessionPassed' // Too late to book morning session
        };
      }
    } else if (session === 'daily') {
      // Daily session - can book until 12:00 noon
      if (currentHour >= 12) {
        return {
          isAvailable: false,
          reason: 'dailySessionPassed' // Too late to book daily session
        };
      }
    }
  }

  // If booking for past date, not available
  if (bookingDay < today) {
    return {
      isAvailable: false,
      reason: 'pastDate'
    };
  }

  return { isAvailable: true };
}

/**
 * Get available sessions for a given date
 * @param date - The booking date (YYYY-MM-DD format)
 * @returns Array of available session types
 */
export function getAvailableSessionsForDate(date: string): Array<'morning' | 'daily'> {
  const sessions: Array<'morning' | 'daily'> = [];

  if (isSessionAvailableForDate(date, 'morning').isAvailable) {
    sessions.push('morning');
  }

  if (isSessionAvailableForDate(date, 'daily').isAvailable) {
    sessions.push('daily');
  }

  return sessions;
}

/**
 * Check if any session is available for today
 * @returns boolean
 */
export function canBookForToday(): boolean {
  const today = new Date().toISOString().split('T')[0];
  return getAvailableSessionsForDate(today).length > 0;
}
