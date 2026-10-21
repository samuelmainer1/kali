/**
 * Timezone Utilities for Frontend
 * Handles timezone detection and formatting for user's location
 */

// Default timezone (Kenya - East Africa Time)
const DEFAULT_TIMEZONE = 'Africa/Nairobi';

/**
 * Detect user's timezone from browser
 * @returns {string} Timezone string (e.g., 'Africa/Nairobi', 'America/New_York')
 */
export const detectUserTimezone = () => {
  try {
    // Try to get timezone from Intl API (most reliable)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone || DEFAULT_TIMEZONE;
  } catch (error) {
    console.warn('Could not detect timezone, using default:', DEFAULT_TIMEZONE);
    return DEFAULT_TIMEZONE;
  }
};

/**
 * Get timezone abbreviation (e.g., 'EAT', 'EST', 'PST')
 * @param {string} timezone - Timezone string
 * @param {Date} date - Date object for DST consideration
 * @returns {string} Timezone abbreviation
 */
export const getTimezoneAbbr = (timezone = DEFAULT_TIMEZONE, date = new Date()) => {
  try {
    const formatter = new Intl.DateTimeFormat('en', {
      timeZoneName: 'short',
      timeZone: timezone
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find(part => part.type === 'timeZoneName');
    return tzPart?.value || 'UTC';
  } catch (error) {
    return 'UTC';
  }
};

/**
 * Format date for user's timezone
 * @param {Date|string} date - Date to format
 * @param {object} options - Formatting options
 * @returns {string} Formatted date string
 */
export const formatDateForUser = (date, options = {}) => {
  if (!date) return 'N/A';

  try {
    const {
      timezone = detectUserTimezone(),
      format = 'full', // 'full', 'date', 'time', 'short'
      showTimezone = true
    } = options;

    const dateObj = new Date(date);

    const formatOptions = {
      full: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone
      },
      short: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: timezone
      },
      date: {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: timezone
      },
      time: {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: timezone
      }
    };

    const formatter = new Intl.DateTimeFormat('en-GB', formatOptions[format] || formatOptions.full);
    const formatted = formatter.format(dateObj);

    if (showTimezone && format !== 'date') {
      const abbr = getTimezoneAbbr(timezone, dateObj);
      return `${formatted} ${abbr}`;
    }

    return formatted;
  } catch (error) {
    console.error('Date formatting error:', error);
    return new Date(date).toISOString();
  }
};

/**
 * Format date only (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @param {string} timezone - Timezone
 * @returns {string} Formatted date
 */
export const formatDateOnly = (date, timezone = detectUserTimezone()) => {
  return formatDateForUser(date, {
    timezone,
    format: 'date',
    showTimezone: false
  });
};

/**
 * Format time only (HH:MM:SS)
 * @param {Date|string} date - Date to format
 * @param {string} timezone - Timezone
 * @returns {string} Formatted time with timezone
 */
export const formatTimeOnly = (date, timezone = detectUserTimezone()) => {
  return formatDateForUser(date, {
    timezone,
    format: 'time',
    showTimezone: true
  });
};

/**
 * Get current time in user's timezone
 * @returns {Date} Current date/time
 */
export const getCurrentUserTime = () => {
  return new Date();
};

/**
 * Store user's timezone in localStorage
 * @param {string} timezone - Timezone to store
 */
export const storeUserTimezone = (timezone) => {
  try {
    localStorage.setItem('userTimezone', timezone);
  } catch (error) {
    console.warn('Could not store timezone:', error);
  }
};

/**
 * Get stored user timezone or detect it
 * @returns {string} User's timezone
 */
export const getUserTimezone = () => {
  try {
    const stored = localStorage.getItem('userTimezone');
    if (stored) return stored;
  } catch (error) {
    console.warn('Could not retrieve stored timezone:', error);
  }
  return detectUserTimezone();
};

/**
 * Initialize timezone detection and storage
 * Call this once when app loads
 */
export const initializeTimezone = () => {
  const timezone = detectUserTimezone();
  storeUserTimezone(timezone);
  return timezone;
};

