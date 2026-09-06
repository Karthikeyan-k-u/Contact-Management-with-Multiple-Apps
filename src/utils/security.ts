/**
 * Security & URL Sanitization Utilities
 */

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'tel:', 'mailto:', 'sms:']);

/**
 * Validates whether an external URL is safe to open or render.
 * Protects against XSS attacks via javascript:, data:, or vbscript: URLs.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();

  // Explicitly disallow script/data execution protocols
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:')
  ) {
    return false;
  }

  // Check valid URI scheme
  try {
    const parsed = new URL(trimmed, 'https://placeholder.local');
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    // Relative or protocol-less URLs
    return !trimmed.includes(':') || trimmed.startsWith('/');
  }
}

/**
 * Sanitizes an Instagram handle to contain only valid alphanumeric, period, and underscore characters.
 */
export function sanitizeInstagramHandle(rawHandle: string): string {
  if (!rawHandle) return '';
  return rawHandle.trim().replace(/^@+/, '').replace(/[^a-zA-Z0-9._]/g, '').slice(0, 30);
}

/**
 * Normalizes website URLs by prepending https:// if protocol is missing.
 */
export function normalizeWebUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Securely launches an external URL with noopener and noreferrer.
 */
export function openSafeExternalWindow(url: string, target = '_blank'): boolean {
  if (!isSafeUrl(url)) {
    console.warn(`[Security Alert] Blocked attempt to open unsafe URL: ${url}`);
    return false;
  }

  if (target === '_blank') {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    window.open(url, target);
  }
  return true;
}
