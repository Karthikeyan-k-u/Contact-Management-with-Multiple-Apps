/**
 * Phone Number Utilities
 * Handles phone normalization, country code detection, and formatting without
 * silently altering user-entered country information.
 */

export function sanitizeDigitsOnly(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Prepares phone number for tel: or sms: URI schemes.
 * Preserves leading '+' for international dialers.
 */
export function normalizePhoneForUri(phone: string): string {
  if (!phone) return '';
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = sanitizeDigitsOnly(trimmed);
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Prepares phone number for WhatsApp wa.me links.
 * WhatsApp wa.me API requires numbers in international format without '+', dashes, or brackets.
 * Example: +1 (415) 892-3401 -> 14158923401
 */
export function normalizePhoneForWhatsApp(phone: string): string {
  if (!phone) return '';
  return sanitizeDigitsOnly(phone);
}

/**
 * Checks whether a phone number string includes an international country code.
 */
export function hasCountryCode(phone: string): boolean {
  if (!phone) return false;
  const trimmed = phone.trim();
  return trimmed.startsWith('+') || trimmed.startsWith('00');
}

/**
 * Basic validation checking if the phone has at least 7 digits.
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone) return false;
  const digits = sanitizeDigitsOnly(phone);
  return digits.length >= 7 && digits.length <= 15;
}

/**
 * Formats a phone number for UI display.
 */
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '—';
  const digits = sanitizeDigitsOnly(phone);

  // Standard US 10-digit
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Standard US 11-digit with 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return phone.trim();
}
