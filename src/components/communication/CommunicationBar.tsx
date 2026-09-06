import React from 'react';
import { Phone, Mail, MessageSquare, MessageCircle, Instagram } from 'lucide-react';
import { Contact, CommunicationChannel } from '../../types';
import { communicationManager } from '../../services/communication/communicationManager';
import { cn } from '../../lib/utils';
import { useToast } from '../ui/Toast';
import { Tooltip } from '../ui/Tooltip';

export interface CommunicationBarProps {
  contact: Contact;
  size?: 'sm' | 'default' | 'lg';
  showLabels?: boolean;
  className?: string;
  onLogInteraction?: (channel: CommunicationChannel) => void;
}

export function CommunicationBar({
  contact,
  size = 'default',
  showLabels = false,
  className,
  onLogInteraction,
}: CommunicationBarProps) {
  const { info, error } = useToast();

  const handleAction = async (e: React.MouseEvent, channel: CommunicationChannel) => {
    e.stopPropagation();

    let recipient = '';
    switch (channel) {
      case 'phone':
      case 'sms':
        recipient = contact.phone;
        break;
      case 'email':
        recipient = contact.email;
        break;
      case 'whatsapp':
        recipient = contact.whatsapp || contact.phone;
        break;
      case 'instagram':
        recipient = contact.instagram || '';
        break;
    }

    if (!recipient) {
      info(
        `No ${channel === 'phone' ? 'phone number' : channel === 'email' ? 'email address' : channel} available`,
        `Please update contact details for ${contact.firstName}`
      );
      return;
    }

    const result = await communicationManager.dispatch({
      channel,
      recipient,
      contactName: `${contact.firstName} ${contact.lastName || ''}`.trim(),
    });

    if (result.success) {
      info(
        `${result.channel.toUpperCase()} App Opened`,
        result.message || `Triggered ${result.channel} action`
      );
    } else {
      error(`Failed to launch ${channel}`, result.message);
    }

    if (onLogInteraction) {
      onLogInteraction(channel);
    }
  };

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const buttonBase = isSmall
    ? 'h-7 w-7 rounded-md p-0 flex items-center justify-center transition-all duration-150'
    : isLarge
    ? 'h-9 px-3 rounded-lg flex items-center gap-2 font-medium text-xs transition-all duration-150 shadow-xs'
    : 'h-8 w-8 rounded-lg p-0 flex items-center justify-center transition-all duration-150 hover:scale-105';

  const iconClass = isSmall ? 'h-3.5 w-3.5' : isLarge ? 'h-4 w-4' : 'h-4 w-4';

  const whatsappNumber = contact.whatsapp || contact.phone;
  const cleanInstagram = contact.instagram ? contact.instagram.replace(/^@/, '') : '';

  return (
    <div className={cn('inline-flex items-center gap-1 sm:gap-1.5', className)}>
      {/* 1. Phone Call */}
      <Tooltip
        content={
          contact.phone ? `Open phone app for ${contact.phone} (tel:)` : 'No phone number'
        }
      >
        <button
          type="button"
          onClick={(e) => handleAction(e, 'phone')}
          className={cn(
            buttonBase,
            contact.phone
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/50'
              : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
          )}
          aria-label={`Open phone dialer for ${contact.phone || 'contact'}`}
          disabled={!contact.phone}
        >
          <Phone className={iconClass} />
          {showLabels && <span>Call</span>}
        </button>
      </Tooltip>

      {/* 2. Email */}
      <Tooltip
        content={
          contact.email ? `Open email client for ${contact.email} (mailto:)` : 'No email address'
        }
      >
        <button
          type="button"
          onClick={(e) => handleAction(e, 'email')}
          className={cn(
            buttonBase,
            contact.email
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-900/50'
              : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
          )}
          aria-label={`Open email client for ${contact.email || 'contact'}`}
          disabled={!contact.email}
        >
          <Mail className={iconClass} />
          {showLabels && <span>Email</span>}
        </button>
      </Tooltip>

      {/* 3. SMS Message */}
      <Tooltip
        content={
          contact.phone ? `Open SMS app for ${contact.phone} (sms:)` : 'No phone number for SMS'
        }
      >
        <button
          type="button"
          onClick={(e) => handleAction(e, 'sms')}
          className={cn(
            buttonBase,
            contact.phone
              ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:hover:bg-purple-900/50'
              : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
          )}
          aria-label={`Open SMS app for ${contact.phone || 'contact'}`}
          disabled={!contact.phone}
        >
          <MessageSquare className={iconClass} />
          {showLabels && <span>SMS</span>}
        </button>
      </Tooltip>

      {/* 4. WhatsApp */}
      <Tooltip
        content={
          whatsappNumber
            ? `Open WhatsApp chat with ${whatsappNumber}`
            : 'No WhatsApp or phone number'
        }
      >
        <button
          type="button"
          onClick={(e) => handleAction(e, 'whatsapp')}
          className={cn(
            buttonBase,
            whatsappNumber
              ? 'bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-950/40 dark:text-green-400 dark:hover:bg-green-900/50'
              : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
          )}
          aria-label={`Open WhatsApp chat with ${whatsappNumber || 'contact'}`}
          disabled={!whatsappNumber}
        >
          <MessageCircle className={iconClass} />
          {showLabels && <span>WhatsApp</span>}
        </button>
      </Tooltip>

      {/* 5. Instagram Profile */}
      <Tooltip
        content={
          cleanInstagram
            ? `Open Instagram Profile: @${cleanInstagram}`
            : 'No Instagram profile set'
        }
      >
        <button
          type="button"
          onClick={(e) => handleAction(e, 'instagram')}
          className={cn(
            buttonBase,
            cleanInstagram
              ? 'bg-pink-50 text-pink-600 hover:bg-pink-100 dark:bg-pink-950/40 dark:text-pink-400 dark:hover:bg-pink-900/50'
              : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
          )}
          aria-label={`Open Instagram profile for @${cleanInstagram || 'contact'}`}
          disabled={!cleanInstagram}
        >
          <Instagram className={iconClass} />
          {showLabels && <span>Instagram</span>}
        </button>
      </Tooltip>
    </div>
  );
}
