import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Instagram,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Plus,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  useInteractions,
  useContacts,
  useDeleteInteraction,
} from '../hooks/useCRM';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { InteractionComposerModal } from '../components/interactions/InteractionComposerModal';
import { formatDateTime, formatRelativeTime } from '../utils/dateUtils';
import { Interaction, InteractionType, Contact } from '../types';
import { useToast } from '../components/ui/Toast';
import {
  openCallApp,
  openEmailApp,
  openSmsApp,
  openWhatsApp,
  openInstagramProfile,
} from '../utils/communicationLinks';

export type ChannelLogKey = Exclude<InteractionType, 'note'>;

export interface ChannelLogPageProps {
  channel: ChannelLogKey;
}

interface ChannelConfig {
  title: string;
  description: string;
  newLabel: string;
  appLabel: string;
  emptyLabel: string;
  emptyDescription: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconBox: string;
  statGrid: string;
}

const CHANNEL_CONFIG: Record<ChannelLogKey, ChannelConfig> = {
  call: {
    title: 'Call Log',
    description: 'Track incoming & outgoing calls, outcomes, and call durations',
    newLabel: 'New Call',
    appLabel: 'Call Back',
    emptyLabel: 'calls',
    emptyDescription:
      'Log your first call to start tracking your phone outreach history. Records show incoming/outgoing direction, outcome, and duration.',
    Icon: Phone,
    iconBox: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    statGrid: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  },
  email: {
    title: 'Email Inbox',
    description: 'Email correspondence across your contacts',
    newLabel: 'New Email',
    appLabel: 'Open Email',
    emptyLabel: 'emails',
    emptyDescription:
      'Compose your first email to begin tracking correspondence. Opening an email launches your mail app with the subject and body pre-filled.',
    Icon: Mail,
    iconBox: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    statGrid: 'grid-cols-2 sm:grid-cols-4',
  },
  sms: {
    title: 'SMS Messages',
    description: 'Text message history and SMS outreach',
    newLabel: 'New SMS',
    appLabel: 'Open SMS',
    emptyLabel: 'SMS messages',
    emptyDescription:
      'Send your first SMS to start tracking text outreach. Records show sent/received direction and message content.',
    Icon: MessageSquare,
    iconBox: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    statGrid: 'grid-cols-2 sm:grid-cols-4',
  },
  whatsapp: {
    title: 'WhatsApp',
    description: 'WhatsApp conversations and wa.me message history',
    newLabel: 'New WhatsApp',
    appLabel: 'Open WhatsApp',
    emptyLabel: 'WhatsApp messages',
    emptyDescription:
      'Opening a WhatsApp record launches the chat directly via wa.me. Log your outreach to keep a complete history.',
    Icon: MessageCircle,
    iconBox: 'bg-green-500/10 text-green-600 dark:text-green-400',
    statGrid: 'grid-cols-2 sm:grid-cols-4',
  },
  instagram: {
    title: 'Instagram',
    description: 'Instagram DMs and social outreach history',
    newLabel: 'New DM',
    appLabel: 'Open Instagram',
    emptyLabel: 'Instagram messages',
    emptyDescription:
      'Start tracking your Instagram direct message outreach. Opening a record navigates to the contact\u2019s profile where you can DM them.',
    Icon: Instagram,
    iconBox: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    statGrid: 'grid-cols-2 sm:grid-cols-4',
  },
};

const DURATION_RE = /\[Duration:\s*([^\]]+)\]/i;
const HANDLE_RE = /\[Instagram Handle:\s*@?([^\]]+)\]/i;

function cleanMessage(message: string): string {
  return message
    .replace(DURATION_RE, '')
    .replace(HANDLE_RE, '')
    .replace(/^\n+/, '')
    .trim();
}

function buildStats(channel: ChannelLogKey, items: Interaction[]) {
  const incoming = items.filter((i) => i.direction === 'incoming').length;
  const outgoing = items.filter((i) => i.direction === 'outgoing').length;
  const uniqueContacts = new Set(items.map((i) => i.contactId)).size;
  if (channel === 'call') {
    const answered = items.filter((i) => i.outcome === 'Answered').length;
    const missed = items.filter((i) => i.outcome && i.outcome !== 'Answered').length;
    return [
      { label: 'Total Calls', value: items.length },
      { label: 'Incoming', value: incoming },
      { label: 'Outgoing', value: outgoing },
      { label: 'Answered', value: answered },
      { label: 'Missed', value: missed },
    ];
  }
  return [
    { label: 'Total', value: items.length },
    { label: 'Sent', value: outgoing },
    { label: 'Received', value: incoming },
    { label: 'Contacts', value: uniqueContacts },
  ];
}

export function ChannelLogPage({ channel }: ChannelLogPageProps) {
  const navigate = useNavigate();
  const config = CHANNEL_CONFIG[channel];
  const { success, error, info } = useToast();
  const { data: contacts = [] } = useContacts();
  const { data: interactions = [] } = useInteractions({ type: channel });
  const deleteInteractionMutation = useDeleteInteraction();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerContactId, setComposerContactId] = useState<string | undefined>(undefined);
  const [interactionToDelete, setInteractionToDelete] = useState<Interaction | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const stats = buildStats(channel, interactions);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openComposer = (contactId?: string) => {
    setComposerContactId(contactId);
    setIsComposerOpen(true);
  };

  const handleDeleteInteraction = async () => {
    if (!interactionToDelete) return;
    try {
      await deleteInteractionMutation.mutateAsync(interactionToDelete.id);
      success('Record deleted', 'Message removed from history');
      setInteractionToDelete(null);
    } catch {
      error('Failed to delete record');
    }
  };

  const getRecipient = (item: Interaction, contact?: Contact): string => {
    if (!contact) return '';
    switch (channel) {
      case 'call':
      case 'sms':
        return contact.phone;
      case 'email':
        return contact.email;
      case 'whatsapp':
        return contact.whatsapp || contact.phone;
      case 'instagram': {
        const parsed = item.message.match(HANDLE_RE);
        return parsed?.[1] ?? contact.instagram ?? '';
      }
    }
  };

  const handleOpenApp = (item: Interaction, contact?: Contact) => {
    const recipient = getRecipient(item, contact);
    if (!recipient) {
      info(
        `No ${channel} handle available`,
        `Update ${contact?.firstName ?? 'the contact'}'s details to launch this app`
      );
      return;
    }
    switch (channel) {
      case 'call':
        openCallApp(recipient);
        break;
      case 'email':
        openEmailApp(recipient, item.subject, cleanMessage(item.message));
        break;
      case 'sms':
        openSmsApp(recipient, cleanMessage(item.message));
        break;
      case 'whatsapp':
        openWhatsApp(recipient, cleanMessage(item.message));
        break;
      case 'instagram':
        openInstagramProfile(recipient);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${config.iconBox}`}>
            <config.Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {config.title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => openComposer()}
          className="shadow-sm"
        >
          {config.newLabel}
        </Button>
      </div>

      {/* Channel-specific stats */}
      <div className={`grid ${config.statGrid} gap-3`}>
        {stats.map((stat) => (
          <div key={stat.label} className="p-3 rounded-xl border border-border bg-card">
            <div className="text-xl font-bold text-foreground">{stat.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Records feed */}
      {interactions.length === 0 ? (
        <EmptyState
          title={`No ${config.emptyLabel} yet`}
          description={config.emptyDescription}
          actionLabel={config.newLabel}
          onAction={() => openComposer()}
        />
      ) : (
        <div className="space-y-3">
          {interactions.map((item) => {
            const contact = contacts.find((c) => c.id === item.contactId);
            const isExpanded = expandedIds.has(item.id);
            const clean = cleanMessage(item.message);
            const isLongMessage = clean.length > 220;
            const durationMatch = item.message.match(DURATION_RE);
            const duration = durationMatch ? durationMatch[1] : null;
            const isIncoming = item.direction === 'incoming';
            const isAnswered = item.outcome === 'Answered';
            const recipient = getRecipient(item, contact);

            return (
              <Card key={item.id} hoverEffect className="transition-all">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border flex-shrink-0 mt-0.5">
                      <config.Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 space-y-2 flex-1">
                      {/* Top badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {(channel === 'call' || channel === 'email') && (
                          <h4 className="font-semibold text-sm sm:text-base text-foreground">
                            {item.subject}
                          </h4>
                        )}

                        {/* Direction: prominent for calls */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            isIncoming
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                          }`}
                        >
                          {isIncoming ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          {isIncoming ? 'Incoming' : 'Outgoing'}
                        </span>

                        {channel === 'call' && item.outcome && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                              isAnswered
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            }`}
                          >
                            {item.outcome}
                          </span>
                        )}

                        {channel === 'call' && duration && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {duration}
                          </span>
                        )}

                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">
                          {item.status}
                        </span>
                      </div>

                      {/* Message content */}
                      <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {isLongMessage && !isExpanded
                          ? `${clean.slice(0, 220)}...`
                          : clean}
                      </div>

                      {isLongMessage && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              Show less <ChevronUp className="h-3 w-3" />
                            </>
                          ) : (
                            <>
                              Read more <ChevronDown className="h-3 w-3" />
                            </>
                          )}
                        </button>
                      )}

                      {/* Contact association */}
                      {contact && (
                        <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                          <span>Contact:</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/contacts/${contact.id}`)}
                            className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5 bg-muted/40 hover:bg-muted px-2 py-0.5 rounded-md border border-border/50"
                          >
                            <Avatar
                              src={contact.avatar}
                              firstName={contact.firstName}
                              lastName={contact.lastName}
                              size="xs"
                            />
                            <span>
                              {contact.firstName} {contact.lastName}
                            </span>
                            {contact.company && (
                              <span className="text-muted-foreground font-normal">
                                · {contact.company}
                              </span>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right column: timestamp & actions */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto text-xs text-muted-foreground shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 gap-2">
                    <div className="text-left sm:text-right">
                      <span
                        className="flex items-center gap-1 font-medium text-foreground/90 cursor-help"
                        title={formatDateTime(item.createdAt)}
                      >
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        {formatDateTime(item.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenApp(item, contact)}
                        className="h-7 px-2 text-xs text-foreground/80"
                        title={`Launch ${channel} app for ${contact?.firstName ?? 'this contact'}`}
                        disabled={!recipient}
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        {config.appLabel}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInteractionToDelete(item)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Composer Modal preset to this channel */}
      <InteractionComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        preselectedContactId={composerContactId}
        defaultChannel={channel}
        onSuccess={() => setIsComposerOpen(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(interactionToDelete)}
        onClose={() => setInteractionToDelete(null)}
        title="Delete Record"
        description={`Are you sure you want to delete this ${channel} record? This action cannot be undone.`}
        confirmText="Delete Record"
        variant="destructive"
        onConfirm={handleDeleteInteraction}
        isLoading={deleteInteractionMutation.isPending}
      />
    </div>
  );
}