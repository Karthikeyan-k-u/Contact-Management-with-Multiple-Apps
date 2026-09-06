import { normalizePhoneForUri, normalizePhoneForWhatsApp } from './phoneUtils';

/**
 * Communication Links Generator
 * Generates safe URIs and handles external application launches.
 */

export function buildCallLink(phone: string): string {
  const normalized = normalizePhoneForUri(phone);
  return `tel:${normalized}`;
}

export function buildEmailLink(email: string, subject?: string, body?: string): string {
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  const query = params.toString() ? `?${params.toString()}` : '';
  return `mailto:${email.trim()}${query}`;
}

export function buildSmsLink(phone: string, body?: string): string {
  const normalized = normalizePhoneForUri(phone);
  const query = body ? `?body=${encodeURIComponent(body)}` : '';
  return `sms:${normalized}${query}`;
}

export function buildWhatsAppLink(phone: string, prefillMessage?: string): string {
  const cleanDigits = normalizePhoneForWhatsApp(phone);
  const textParam = prefillMessage ? `?text=${encodeURIComponent(prefillMessage)}` : '';
  return `https://wa.me/${cleanDigits}${textParam}`;
}

export function buildInstagramProfileLink(handle: string): string {
  const cleanHandle = handle.trim().replace(/^@/, '');
  return `https://instagram.com/${cleanHandle}`;
}

export function openCallApp(phone: string): void {
  if (!phone) return;
  window.open(buildCallLink(phone), '_self');
}

export function openEmailApp(email: string, subject?: string, body?: string): void {
  if (!email) return;
  window.open(buildEmailLink(email, subject, body), '_blank');
}

export function openSmsApp(phone: string, body?: string): void {
  if (!phone) return;
  window.open(buildSmsLink(phone, body), '_self');
}

export function openWhatsApp(phone: string, prefillMessage?: string): void {
  if (!phone) return;
  window.open(buildWhatsAppLink(phone, prefillMessage), '_blank', 'noopener,noreferrer');
}

export function openInstagramProfile(handle: string): void {
  if (!handle) return;
  window.open(buildInstagramProfileLink(handle), '_blank', 'noopener,noreferrer');
}
