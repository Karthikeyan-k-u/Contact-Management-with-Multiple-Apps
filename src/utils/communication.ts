import { CommunicationChannel } from '../types';

export interface ChannelConfig {
  id: CommunicationChannel;
  name: string;
  iconName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  actionLabel: string;
}

export const CHANNELS: Record<CommunicationChannel, ChannelConfig> = {
  phone: {
    id: 'phone',
    name: 'Phone Call',
    iconName: 'Phone',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800/50',
    description: 'Direct cellular or VoIP voice call',
    actionLabel: 'Call Now',
  },
  email: {
    id: 'email',
    name: 'Email',
    iconName: 'Mail',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800/50',
    description: 'Send electronic mail to contact address',
    actionLabel: 'Send Email',
  },
  sms: {
    id: 'sms',
    name: 'SMS Message',
    iconName: 'MessageSquare',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800/50',
    description: 'Cellular text message dispatch',
    actionLabel: 'Send SMS',
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    iconName: 'MessageCircle',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/40',
    borderColor: 'border-green-200 dark:border-green-800/50',
    description: 'Direct encrypted WhatsApp chat or web launch',
    actionLabel: 'Open WhatsApp',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    iconName: 'Instagram',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/40',
    borderColor: 'border-pink-200 dark:border-pink-800/50',
    description: 'Instagram Direct Message or profile outreach',
    actionLabel: 'Open Instagram',
  },
};

export function sanitizePhoneNumber(phone: string): string {
  // strip formatting characters: (), -, spaces, +
  return phone.replace(/[^\d+]/g, '').replace(/^\+/, '');
}

export function sanitizeInstagramHandle(handle: string): string {
  return handle.trim().replace(/^@/, '');
}

export function triggerCall(phone: string): void {
  if (!phone) return;
  window.open(`tel:${phone.replace(/[^\d+]/g, '')}`, '_self');
}

export function triggerEmail(email: string, subject?: string, body?: string): void {
  if (!email) return;
  const params = new URLSearchParams();
  if (subject) params.append('subject', subject);
  if (body) params.append('body', body);
  const query = params.toString() ? `?${params.toString()}` : '';
  window.open(`mailto:${email}${query}`, '_blank');
}

export function triggerSms(phone: string, message?: string): void {
  if (!phone) return;
  const sanitized = phone.replace(/[^\d+]/g, '');
  const bodyParam = message ? `?body=${encodeURIComponent(message)}` : '';
  window.open(`sms:${sanitized}${bodyParam}`, '_self');
}

export function triggerWhatsApp(phoneOrWhatsapp: string, prefillMessage?: string): void {
  if (!phoneOrWhatsapp) return;
  const sanitized = sanitizePhoneNumber(phoneOrWhatsapp);
  const textParam = prefillMessage ? `?text=${encodeURIComponent(prefillMessage)}` : '';
  window.open(`https://wa.me/${sanitized}${textParam}`, '_blank', 'noopener,noreferrer');
}

export function triggerInstagram(handle: string): void {
  if (!handle) return;
  const clean = sanitizeInstagramHandle(handle);
  window.open(`https://instagram.com/${clean}`, '_blank', 'noopener,noreferrer');
}
