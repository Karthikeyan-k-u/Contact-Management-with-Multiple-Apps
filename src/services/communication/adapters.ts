import {
  CommunicationPayload,
  CommunicationResult,
  ICommunicationProvider,
} from './contracts';
import { normalizePhoneForUri, normalizePhoneForWhatsApp } from '../../utils/phoneUtils';
import { sanitizeInstagramHandle, openSafeExternalWindow } from '../../utils/security';

/**
 * 1. Phone Deep Link Provider
 * Triggers device native dialer via tel: URI scheme
 */
export class PhoneDeepLinkAdapter implements ICommunicationProvider {
  readonly channel = 'phone';
  readonly name = 'Native Phone Dialer';
  readonly deliveryMode = 'external_client';

  async execute(payload: CommunicationPayload): Promise<CommunicationResult> {
    const cleanPhone = normalizePhoneForUri(payload.recipient);
    const targetUri = `tel:${cleanPhone}`;

    window.open(targetUri, '_self');

    return {
      success: true,
      status: 'Opened',
      deliveryMode: 'external_client',
      channel: 'phone',
      actionTaken: 'Triggered native device dialer',
      message: `Opened phone app for ${payload.recipient}`,
      targetUri,
    };
  }
}

/**
 * 2. Email Mailto Provider
 * Triggers user default mail client via mailto: URI scheme
 */
export class EmailMailtoAdapter implements ICommunicationProvider {
  readonly channel = 'email';
  readonly name = 'Default Email Client';
  readonly deliveryMode = 'external_client';

  async execute(payload: CommunicationPayload): Promise<CommunicationResult> {
    const params = new URLSearchParams();
    if (payload.subject) params.append('subject', payload.subject);
    if (payload.message) params.append('body', payload.message);

    const query = params.toString() ? `?${params.toString()}` : '';
    const targetUri = `mailto:${payload.recipient.trim()}${query}`;

    window.open(targetUri, '_blank');

    return {
      success: true,
      status: 'Opened',
      deliveryMode: 'external_client',
      channel: 'email',
      actionTaken: 'Opened default email client',
      message: `Opened mail client for ${payload.recipient}`,
      targetUri,
    };
  }
}

/**
 * 3. SMS Deep Link Provider
 * Triggers device SMS messaging app via sms: URI scheme
 */
export class SmsDeepLinkAdapter implements ICommunicationProvider {
  readonly channel = 'sms';
  readonly name = 'Native SMS App';
  readonly deliveryMode = 'external_client';

  async execute(payload: CommunicationPayload): Promise<CommunicationResult> {
    const cleanPhone = normalizePhoneForUri(payload.recipient);
    const query = payload.message ? `?body=${encodeURIComponent(payload.message)}` : '';
    const targetUri = `sms:${cleanPhone}${query}`;

    window.open(targetUri, '_self');

    return {
      success: true,
      status: 'Opened',
      deliveryMode: 'external_client',
      channel: 'sms',
      actionTaken: 'Triggered native SMS messaging client',
      message: `Opened SMS app for ${payload.recipient}`,
      targetUri,
    };
  }
}

/**
 * 4. WhatsApp Deep Link Provider
 * Launches WhatsApp chat window via official wa.me deep link
 */
export class WhatsAppDeepLinkAdapter implements ICommunicationProvider {
  readonly channel = 'whatsapp';
  readonly name = 'WhatsApp Direct Link';
  readonly deliveryMode = 'external_client';

  async execute(payload: CommunicationPayload): Promise<CommunicationResult> {
    const cleanDigits = normalizePhoneForWhatsApp(payload.recipient);
    const textParam = payload.message ? `?text=${encodeURIComponent(payload.message)}` : '';
    const targetUri = `https://wa.me/${cleanDigits}${textParam}`;

    openSafeExternalWindow(targetUri);

    return {
      success: true,
      status: 'Opened',
      deliveryMode: 'external_client',
      channel: 'whatsapp',
      actionTaken: 'Opened WhatsApp Web/Desktop conversation',
      message: `Opened WhatsApp chat with ${payload.recipient}`,
      targetUri,
    };
  }
}

/**
 * 5. Instagram Profile Link Provider
 * Opens sanitized Instagram profile in a secure new tab
 */
export class InstagramProfileAdapter implements ICommunicationProvider {
  readonly channel = 'instagram';
  readonly name = 'Instagram Profile Viewer';
  readonly deliveryMode = 'external_client';

  async execute(payload: CommunicationPayload): Promise<CommunicationResult> {
    const cleanHandle = sanitizeInstagramHandle(payload.recipient);
    const targetUri = `https://instagram.com/${cleanHandle}`;

    openSafeExternalWindow(targetUri);

    return {
      success: true,
      status: 'Opened',
      deliveryMode: 'external_client',
      channel: 'instagram',
      actionTaken: 'Navigated to Instagram user profile',
      message: `Opened @${cleanHandle} on Instagram`,
      targetUri,
    };
  }
}

/**
 * FUTURE BACKEND INTEGRATION STUBS:
 * When connecting a real backend (Node/Express, Python/FastAPI, Go),
 * implement API providers conforming to ICommunicationProvider with
 * deliveryMode = 'api' and truthful status = 'Sent' upon confirmed dispatch.
 *
 * Example:
 * export class TwilioSmsApiProvider implements ICommunicationProvider { ... }
 * export class SendGridEmailApiProvider implements ICommunicationProvider { ... }
 * export class WhatsAppCloudApiProvider implements ICommunicationProvider { ... }
 */
