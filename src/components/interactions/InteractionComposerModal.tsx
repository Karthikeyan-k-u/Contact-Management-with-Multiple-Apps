import React, { useEffect, useState } from 'react';
import {
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Instagram,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  CallOutcome,
  CommunicationChannel,
  Contact,
  Interaction,
  InteractionDirection,
  InteractionStatus,
  InteractionType,
} from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { useContacts, useLogInteraction } from '../../hooks/useCRM';
import { useToast } from '../ui/Toast';
import { communicationManager } from '../../services/communication/communicationManager';
import { hasCountryCode, formatPhoneDisplay } from '../../utils/phoneUtils';

export interface InteractionComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContactId?: string;
  defaultChannel?: InteractionType;
  onSuccess?: (interaction: Interaction) => void;
}

const CHANNELS: {
  id: InteractionType;
  label: string;
  icon: React.ReactNode;
  color: string;
  activeClass: string;
}[] = [
  {
    id: 'call',
    label: 'Call',
    icon: <Phone className="h-4 w-4" />,
    color: 'text-emerald-500',
    activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold',
  },
  {
    id: 'email',
    label: 'Email',
    icon: <Mail className="h-4 w-4" />,
    color: 'text-blue-500',
    activeClass: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold',
  },
  {
    id: 'sms',
    label: 'SMS',
    icon: <MessageSquare className="h-4 w-4" />,
    color: 'text-purple-500',
    activeClass: 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold',
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: <MessageCircle className="h-4 w-4" />,
    color: 'text-green-500',
    activeClass: 'border-green-500 bg-green-500/10 text-green-600 dark:text-green-400 font-semibold',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: <Instagram className="h-4 w-4" />,
    color: 'text-pink-500',
    activeClass: 'border-pink-500 bg-pink-500/10 text-pink-600 dark:text-pink-400 font-semibold',
  },
  {
    id: 'note',
    label: 'Internal Note',
    icon: <FileText className="h-4 w-4" />,
    color: 'text-amber-500',
    activeClass: 'border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold',
  },
];

const CALL_OUTCOMES: { value: CallOutcome; label: string }[] = [
  { value: 'Answered', label: 'Answered / Connected' },
  { value: 'No answer', label: 'No Answer' },
  { value: 'Voicemail', label: 'Left Voicemail' },
  { value: 'Busy', label: 'Busy Line' },
  { value: 'Callback requested', label: 'Callback Requested' },
];

export function InteractionComposerModal({
  isOpen,
  onClose,
  preselectedContactId,
  defaultChannel = 'call',
  onSuccess,
}: InteractionComposerModalProps) {
  const { data: contacts = [] } = useContacts();
  const logInteractionMutation = useLogInteraction();
  const { success, error, info } = useToast();

  const [selectedContactId, setSelectedContactId] = useState<string>(preselectedContactId || '');
  const [channel, setChannel] = useState<InteractionType>(defaultChannel);
  const [direction, setDirection] = useState<InteractionDirection>('outgoing');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [outcome, setOutcome] = useState<CallOutcome>('Answered');
  const [callDuration, setCallDuration] = useState<string>('');
  const [customHandle, setCustomHandle] = useState<string>('');
  const [alsoLaunchExternal, setAlsoLaunchExternal] = useState<boolean>(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const selectedContact = contacts.find((c) => c.id === selectedContactId);

  // Initialize and reset form when opening
  useEffect(() => {
    if (isOpen) {
      const initialContactId = preselectedContactId || (contacts[0]?.id ?? '');
      setSelectedContactId(initialContactId);
      setChannel(defaultChannel);
      setDirection(defaultChannel === 'note' ? 'outgoing' : 'outgoing');
      setSubject(getDefaultSubject(defaultChannel));
      setMessage('');
      setOutcome('Answered');
      setCallDuration('');
      setAlsoLaunchExternal(true);
      setFormErrors({});

      const c = contacts.find((item) => item.id === initialContactId);
      if (c?.instagram) {
        setCustomHandle(c.instagram.replace(/^@/, ''));
      } else {
        setCustomHandle('');
      }
    }
  }, [isOpen, preselectedContactId, defaultChannel, contacts]);

  // Sync instagram handle when contact changes
  useEffect(() => {
    if (selectedContact?.instagram) {
      setCustomHandle(selectedContact.instagram.replace(/^@/, ''));
    }
  }, [selectedContact]);

  function getDefaultSubject(ch: InteractionType): string {
    switch (ch) {
      case 'call':
        return 'Phone call discussion';
      case 'email':
        return '';
      case 'sms':
        return 'SMS update';
      case 'whatsapp':
        return 'WhatsApp conversation';
      case 'instagram':
        return 'Instagram DM outreach';
      case 'note':
        return 'Meeting notes';
      default:
        return '';
    }
  }

  const handleChannelChange = (newChannel: InteractionType) => {
    setChannel(newChannel);
    setFormErrors({});
    if (!subject || subject === getDefaultSubject(channel)) {
      setSubject(getDefaultSubject(newChannel));
    }
  };

  const handleContactChange = (newId: string) => {
    setSelectedContactId(newId);
    const c = contacts.find((item) => item.id === newId);
    if (c?.instagram) {
      setCustomHandle(c.instagram.replace(/^@/, ''));
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!selectedContactId) {
      errs.contact = 'Please select a contact';
    }
    if (!subject.trim() && channel !== 'sms') {
      errs.subject = 'Subject / Title is required';
    }
    if (!message.trim()) {
      errs.message = channel === 'call' || channel === 'note' ? 'Notes/Summary is required' : 'Message content is required';
    }
    if (channel === 'instagram' && !customHandle.trim()) {
      errs.instagram = 'Instagram username is required';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Launch external app explicitly via provider architecture
  const handleLaunchExternalOnly = async () => {
    if (!selectedContact) {
      error('No contact selected', 'Please choose a contact first');
      return;
    }

    if (channel === 'note') {
      return;
    }

    let recipient = '';
    switch (channel) {
      case 'call':
      case 'sms':
        recipient = selectedContact.phone;
        break;
      case 'email':
        recipient = selectedContact.email;
        break;
      case 'whatsapp':
        recipient = selectedContact.whatsapp || selectedContact.phone;
        break;
      case 'instagram':
        recipient = customHandle || selectedContact.instagram || '';
        break;
    }

    if (!recipient) {
      info(
        `No ${channel === 'call' ? 'phone number' : channel === 'email' ? 'email address' : channel} available`,
        `Please update contact details for ${selectedContact.firstName}`
      );
      return;
    }

    const mappedChannel: CommunicationChannel = channel === 'call' ? 'phone' : channel;
    const commResult = await communicationManager.dispatch({
      channel: mappedChannel,
      recipient,
      subject,
      message,
      contactName: `${selectedContact.firstName} ${selectedContact.lastName || ''}`.trim(),
    });

    if (commResult.success) {
      info(
        `${channel.toUpperCase()} App Opened`,
        commResult.message || `Triggered external ${channel} link`
      );
    } else {
      error(`Failed to launch ${channel}`, commResult.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!selectedContact) return;

    // Determine truthful status
    let status: InteractionStatus = 'Logged';
    if (channel === 'call') {
      status = outcome === 'Answered' ? 'Completed' : 'Missed';
    } else if (channel === 'note') {
      status = 'Completed';
    } else if (alsoLaunchExternal && direction === 'outgoing') {
      // Truthful status: external application was launched
      status = 'Opened';
    } else {
      // Manually logged touchpoint
      status = 'Logged';
    }

    // Format final message/notes
    let finalMessage = message.trim();
    if (channel === 'call' && callDuration.trim()) {
      finalMessage = `[Duration: ${callDuration.trim()}]\n\n${finalMessage}`;
    }
    if (channel === 'instagram') {
      finalMessage = `[Instagram Handle: @${customHandle.replace(/^@/, '')}]\n\n${finalMessage}`;
    }

    const payload: Omit<Interaction, 'id' | 'createdAt'> = {
      contactId: selectedContactId,
      type: channel,
      direction,
      subject: subject.trim() || `${channel.toUpperCase()} touchpoint`,
      message: finalMessage,
      status,
      outcome: channel === 'call' ? outcome : undefined,
    };

    // If alsoLaunchExternal is checked and it's outgoing, trigger the external provider
    if (alsoLaunchExternal && direction === 'outgoing' && channel !== 'note') {
      await handleLaunchExternalOnly();
    }

    try {
      const created = await logInteractionMutation.mutateAsync(payload);
      success(
        'Touchpoint Logged',
        `Recorded ${channel} entry in timeline for ${selectedContact.firstName}`
      );
      if (onSuccess) {
        onSuccess(created);
      }
      onClose();
    } catch {
      error('Failed to log interaction', 'Please try again.');
    }
  };

  const whatsappPhone = selectedContact?.whatsapp || selectedContact?.phone;
  const whatsappHasCountryCode = whatsappPhone ? hasCountryCode(whatsappPhone) : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Interaction Composer"
      description="Connect directly with contacts and record unified interaction history"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact Selector / Header Banner */}
        <div className="rounded-xl border border-border/80 bg-muted/30 p-3">
          {!preselectedContactId ? (
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Select Contact *
              </label>
              <Select
                value={selectedContactId}
                onChange={(e) => handleContactChange(e.target.value)}
                error={formErrors.contact}
                options={[
                  { value: '', label: '-- Choose a contact --' },
                  ...contacts.map((c) => ({
                    value: c.id,
                    label: `${c.firstName} ${c.lastName || ''} · ${c.company || c.email}`,
                  })),
                ]}
              />
            </div>
          ) : (
            selectedContact && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={selectedContact.avatar}
                    firstName={selectedContact.firstName}
                    lastName={selectedContact.lastName}
                    size="md"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      {selectedContact.firstName} {selectedContact.lastName}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {selectedContact.jobTitle ? `${selectedContact.jobTitle} · ` : ''}
                      {selectedContact.company || selectedContact.email}
                    </p>
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground hidden sm:block">
                  <div>{formatPhoneDisplay(selectedContact.phone)}</div>
                  <div>{selectedContact.email}</div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Channel Selection Tabs */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Communication Channel
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {CHANNELS.map((ch) => {
              const isSelected = channel === ch.id;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleChannelChange(ch.id)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? ch.activeClass + ' shadow-xs ring-1 ring-primary/20'
                      : 'border-border/70 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`mb-1.5 ${isSelected ? ch.color : 'text-muted-foreground'}`}>
                    {ch.icon}
                  </span>
                  <span>{ch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Direction & Metadata Row (Not applicable for internal notes) */}
        {channel !== 'note' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-foreground/80">Direction</label>
              <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setDirection('outgoing')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    direction === 'outgoing'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5 text-blue-500" />
                  Outgoing
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('incoming')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    direction === 'incoming'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />
                  Incoming
                </button>
              </div>
            </div>

            {channel === 'call' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground/80">Call Outcome</label>
                <Select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value as CallOutcome)}
                  options={CALL_OUTCOMES}
                />
              </div>
            )}

            {channel === 'instagram' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground/80">
                  Instagram Handle *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-muted-foreground pointer-events-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={customHandle}
                    onChange={(e) => setCustomHandle(e.target.value)}
                    placeholder="username"
                    className="w-full pl-7 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-hidden focus:ring-2 focus:ring-ring"
                  />
                </div>
                {formErrors.instagram && (
                  <p className="text-xs text-destructive">{formErrors.instagram}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dynamic Channel Warnings / Guidance */}
        {channel === 'whatsapp' && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">WhatsApp Direct Chat (wa.me)</p>
              <p className="mt-0.5 text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                Opening WhatsApp uses the official wa.me deep link with pre-filled text.
                {!whatsappHasCountryCode && whatsappPhone && (
                  <span className="block mt-1 font-semibold text-amber-900 dark:text-amber-200">
                    ⚠️ Note: Phone number ({whatsappPhone}) appears to lack an international country code (e.g., +1 for US). For best results, include the country code.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {channel === 'instagram' && (
          <div className="rounded-lg border border-pink-500/20 bg-pink-500/10 p-2.5 text-xs text-pink-900 dark:text-pink-300 flex items-start gap-2">
            <Instagram className="h-4 w-4 shrink-0 mt-0.5 text-pink-500" />
            <div>
              <p className="font-medium">Instagram Public Profile & Direct Message Guidance</p>
              <p className="mt-0.5 text-pink-800/90 dark:text-pink-300/90 leading-relaxed">
                Instagram does not permit third-party web apps to deep-link directly into private message threads.
                Clicking &quot;Open Instagram Profile&quot; opens the user&apos;s public profile in a new tab where you can send a DM. You can record your conversation notes here.
              </p>
            </div>
          </div>
        )}

        {/* Subject Input */}
        {channel !== 'sms' && (
          <Input
            label={channel === 'note' ? 'Note Title *' : 'Subject / Topic *'}
            placeholder={
              channel === 'email'
                ? 'e.g. Contract review and next steps'
                : channel === 'call'
                ? 'e.g. Quarterly check-in call'
                : 'e.g. Product demo follow-up'
            }
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            error={formErrors.subject}
          />
        )}

        {/* Message / Notes Textarea */}
        <Textarea
          label={
            channel === 'call'
              ? 'Call Notes & Discussion Summary *'
              : channel === 'note'
              ? 'Internal Note Content *'
              : channel === 'email'
              ? 'Email Message Body *'
              : 'Message Content *'
          }
          placeholder={
            channel === 'email'
              ? 'Draft your email body here. Opening your email app will pre-fill this text...'
              : channel === 'whatsapp' || channel === 'sms'
              ? 'Type the message to send via external app...'
              : 'Record details, commitments, next steps...'
          }
          rows={channel === 'email' ? 5 : 3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          error={formErrors.message}
        />

        {/* Call Specific duration input */}
        {channel === 'call' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Call Duration (Optional)"
              placeholder="e.g. 15 mins or 3m 45s"
              value={callDuration}
              onChange={(e) => setCallDuration(e.target.value)}
            />
          </div>
        )}

        {/* Deep link toggle for Outgoing */}
        {direction === 'outgoing' && channel !== 'note' && (
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-muted/20">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="launchExternalToggle"
                checked={alsoLaunchExternal}
                onChange={(e) => setAlsoLaunchExternal(e.target.checked)}
                className="h-4 w-4 rounded-sm border-input text-primary focus:ring-primary"
              />
              <label htmlFor="launchExternalToggle" className="text-xs text-foreground font-medium cursor-pointer">
                Also launch native external application after updating
              </label>
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              ({channel === 'call' ? 'tel:' : channel === 'email' ? 'mailto:' : channel === 'sms' ? 'sms:' : channel === 'whatsapp' ? 'wa.me' : 'instagram.com'})
            </span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-3 border-t border-border/70">
          {/* Direct Launch Button */}
          {channel !== 'note' && direction === 'outgoing' ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleLaunchExternalOnly}
              className="text-xs flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open{' '}
              {channel === 'call'
                ? 'Phone App'
                : channel === 'email'
                ? 'Email App'
                : channel === 'sms'
                ? 'SMS App'
                : channel === 'whatsapp'
                ? 'WhatsApp'
                : 'Instagram Profile'}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={logInteractionMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={logInteractionMutation.isPending}
              className="gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              Update Log
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
