/**
 * Checks if a day has passed between the given date and now
 * @param date The date to compare against
 * @returns boolean True if at least one day has passed
 */
export function hasDayPassed(date: Date): boolean {
  if (!date) return true;
  
  const now = new Date();
  // Reset at midnight
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastDate = new Date(
    date.getFullYear(), 
    date.getMonth(), 
    date.getDate()
  );
  
  // Compare dates (ignoring time)
  return today > lastDate;
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
 * Gets the next reset date (tomorrow at midnight)
 * @returns Date The next reset date
 */
export function getNextResetDate(): Date {
  const now = new Date();
  // Get tomorrow's date at midnight
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow;
}

/**
 * Calculates time remaining until next reset
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