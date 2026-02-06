/**
 * Currency formatting utilities
 *
 * These functions are extracted from components to avoid recreating
 * them on every render, following React performance best practices.
 */

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/**
 * Formats a number as USD currency string
 * @param amount - The amount to format
 * @returns Formatted currency string (e.g., "$1,234.56")
 */
export function formatCurrency(amount: number): string {
  return CURRENCY_FORMATTER.format(Math.abs(amount));
}

// Time constants for relative time calculations
const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

/**
 * Formats a date string as relative time (e.g., "2 hours ago", "3 days ago")
 * @param dateString - ISO date string or null
 * @returns Human-readable relative time string
 */
export function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "No activity";

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = Math.floor(diffInMs / MS_PER_HOUR);

  if (diffInHours < 1) return "Just now";
  if (diffInHours < 24)
    return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;

  const diffInDays = Math.floor(diffInMs / MS_PER_DAY);
  if (diffInDays < 7)
    return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks} week${diffInWeeks === 1 ? "" : "s"} ago`;
}

/**
 * Formats a date as a localized date string
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
