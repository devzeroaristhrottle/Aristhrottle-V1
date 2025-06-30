/**
 * Checks if the current UTC day is different from the stored date's UTC day
 * @param date The date to compare against
 * @returns boolean True if the UTC day has changed
 */
export function hasDayPassed(date: Date): boolean {
  if (!date) return true;
  
  const now = new Date();
  
  // Get UTC day for both dates
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const lastDateUtc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  
  // Compare dates (ignoring time)
  return todayUtc > lastDateUtc;
}

/**
 * Formats a date to a readable string
 * @param date The date to format
 * @returns string Formatted date string
 */
export function formatDate(date: Date | string): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Gets the next reset date (next day at 00:00 UTC)
 * @returns Date The next reset date
 */
export function getNextResetDate(): Date {
  const now = new Date();
  // Get tomorrow's date at midnight UTC
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return tomorrow;
}

/**
 * Calculates time remaining until next reset (00:00 UTC)
 * @returns string Time remaining in human readable format
 */
export function getTimeUntilReset(): string {
  const now = new Date();
  const nextReset = getNextResetDate();
  
  // Calculate hours and minutes until reset
  const diffMs = nextReset.getTime() - now.getTime();
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHrs > 0) {
    return `${diffHrs}h ${diffMins}m`;
  } else {
    return `${diffMins}m`;
  }
} 