import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Instagram,
  FileText,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Calendar,
  Trash2,
  Reply,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  PhoneCall,
  Send,
  ExternalLink,
} from 'lucide-react';
import {
  useInteractions,
  useContacts,
  useInteractionStats,
  useDeleteInteraction,
} from '../hooks/useCRM';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { InteractionComposerModal } from '../components/interactions/InteractionComposerModal';
import { formatDateTime, formatRelativeTime } from '../utils/dateUtils';
import { InteractionType, InteractionDirection, Interaction } from '../types';
import { useToast } from '../components/ui/Toast';

export function InteractionsPage() {
  const navigate = useNavigate();
  const { data: stats } = useInteractionStats();
  const { data: contacts = [] } = useContacts();
  const deleteInteractionMutation = useDeleteInteraction();
  const { success, error } = useToast();

  // Filters State
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<InteractionType | 'all'>('all');
  const [directionFilter, setDirectionFilter] = useState<InteractionDirection | 'all'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contactFilter, setContactFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Expanded message IDs for "Read more"
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Composer Modal State
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [composerContactId, setComposerContactId] = useState<string | undefined>(undefined);
  const [composerChannel, setComposerChannel] = useState<InteractionType>('call');

  // Delete Confirmation State
  const [interactionToDelete, setInteractionToDelete] = useState<Interaction | null>(null);

  const { data: interactions = [], isLoading } = useInteractions({
    search,
    type: typeFilter,
    direction: directionFilter,
    dateRange: dateRangeFilter,
    status: statusFilter,
    contactId: contactFilter,
    sortOrder,
  });

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

  const hasActiveFilters =
    search.trim() !== '' ||
    typeFilter !== 'all' ||
    directionFilter !== 'all' ||
    dateRangeFilter !== 'all' ||
    statusFilter !== 'all' ||
    contactFilter !== 'all';

  const clearAllFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setDirectionFilter('all');
    setDateRangeFilter('all');
    setStatusFilter('all');
    setContactFilter('all');
  };

  const handleOpenComposerForContact = (contactId: string, channelType: InteractionType) => {
    setComposerContactId(contactId);
    setComposerChannel(channelType);
    setIsComposerOpen(true);
  };

  const handleDeleteInteraction = async () => {
    if (!interactionToDelete) return;
    try {
      await deleteInteractionMutation.mutateAsync(interactionToDelete.id);
      success('Interaction deleted', 'Record removed from history');
      setInteractionToDelete(null);
    } catch {
      error('Failed to delete interaction');
    }
  };

  const getChannelBadge = (type: string) => {
    switch (type) {
      case 'call':
        return {
          icon: <Phone className="h-3.5 w-3.5 text-emerald-500" />,
          label: 'Call',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'email':
        return {
          icon: <Mail className="h-3.5 w-3.5 text-blue-500" />,
          label: 'Email',
          badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        };
      case 'sms':
        return {
          icon: <MessageSquare className="h-3.5 w-3.5 text-purple-500" />,
          label: 'SMS',
          badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        };
      case 'whatsapp':
        return {
          icon: <MessageCircle className="h-3.5 w-3.5 text-green-500" />,
          label: 'WhatsApp',
          badgeClass: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
        };
      case 'instagram':
        return {
          icon: <Instagram className="h-3.5 w-3.5 text-pink-500" />,
          label: 'Instagram',
          badgeClass: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
        };
      default:
        return {
          icon: <FileText className="h-3.5 w-3.5 text-amber-500" />,
          label: 'Internal Note',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Messages
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Centralized communications history across calls, emails, WhatsApp messages, SMS, and Instagram DMs
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setComposerContactId(undefined);
            setComposerChannel('call');
            setIsComposerOpen(true);
          }}
          className="shadow-sm"
        >
          New Message
        </Button>
      </div>

      {/* Channel Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total */}
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`p-3 rounded-xl border text-left transition-all ${
            typeFilter === 'all'
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Total</span>
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-xl font-bold text-foreground mt-1">{stats?.total ?? 0}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">All touchpoints</div>
        </button>

        {/* Calls */}
        <button
          type="button"
          onClick={() => setTypeFilter(typeFilter === 'call' ? 'all' : 'call')}
          className={`p-3 rounded-xl border text-left transition-all ${
            typeFilter === 'call'
              ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-xs'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Calls</span>
            <Phone className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats?.calls ?? 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Voice & VoIP</div>
        </button>

        {/* Emails */}
        <button
          type="button"
          onClick={() => setTypeFilter(typeFilter === 'email' ? 'all' : 'email')}
          className={`p-3 rounded-xl border text-left transition-all ${
            typeFilter === 'email'
              ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30 shadow-xs'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Emails</span>
            <Mail className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {stats?.emails ?? 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Dispatches</div>
        </button>

        {/* WhatsApp */}
        <button
          type="button"
          onClick={() => setTypeFilter(typeFilter === 'whatsapp' ? 'all' : 'whatsapp')}
          className={`p-3 rounded-xl border text-left transition-all ${
            typeFilter === 'whatsapp'
              ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500/30 shadow-xs'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">WhatsApp</span>
            <MessageCircle className="h-3.5 w-3.5 text-green-500" />
          </div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
            {stats?.whatsapp ?? 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">wa.me chats</div>
        </button>

        {/* SMS */}
        <button
          type="button"
          onClick={() => setTypeFilter(typeFilter === 'sms' ? 'all' : 'sms')}
          className={`p-3 rounded-xl border text-left transition-all ${
            typeFilter === 'sms'
              ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30 shadow-xs'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">SMS</span>
            <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
          </div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {stats?.sms ?? 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Mobile texts</div>
        </button>

        {/* Instagram */}
        <button
          type="button"
          onClick={() => setTypeFilter(typeFilter === 'instagram' ? 'all' : 'instagram')}
          className={`p-3 rounded-xl border text-left transition-all ${
            typeFilter === 'instagram'
              ? 'border-pink-500 bg-pink-500/10 ring-1 ring-pink-500/30 shadow-xs'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Instagram</span>
            <Instagram className="h-3.5 w-3.5 text-pink-500" />
          </div>
          <div className="text-xl font-bold text-pink-600 dark:text-pink-400 mt-1">
            {stats?.instagram ?? 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Outreach</div>
        </button>

        {/* Notes */}
        <button
          type="button"
          onClick={() => setTypeFilter(typeFilter === 'note' ? 'all' : 'note')}
          className={`p-3 rounded-xl border text-left transition-all ${
            typeFilter === 'note'
              ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30 shadow-xs'
              : 'border-border bg-card hover:bg-muted/40'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium">Notes</span>
            <FileText className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {stats?.notes ?? 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Internal Notes</div>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 space-y-3.5">
          {/* Top Search & Primary Filters */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 max-w-lg">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search subject, message content, or contact name..."
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Date Range Selector */}
              <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg border border-border text-xs">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground ml-1.5" />
                {(['all', 'today', '7days', '30days'] as const).map((dr) => (
                  <button
                    key={dr}
                    type="button"
                    onClick={() => setDateRangeFilter(dr)}
                    className={`px-2 py-1 rounded-md capitalize font-medium transition-all ${
                      dateRangeFilter === dr
                        ? 'bg-background text-foreground shadow-xs font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {dr === 'all'
                      ? 'All Time'
                      : dr === 'today'
                      ? 'Today'
                      : dr === '7days'
                      ? '7 Days'
                      : '30 Days'}
                  </button>
                ))}
              </div>

              {/* Direction Filter */}
              <div className="flex rounded-lg border border-border bg-muted/40 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDirectionFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    directionFilter === 'all'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter('outgoing')}
                  className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                    directionFilter === 'outgoing'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowUpRight className="h-3 w-3 text-blue-500" />
                  Out
                </button>
                <button
                  type="button"
                  onClick={() => setDirectionFilter('incoming')}
                  className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 transition-all ${
                    directionFilter === 'incoming'
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                  In
                </button>
              </div>

              {/* Sort Order */}
              <button
                type="button"
                onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                className="px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1"
                title="Toggle sort direction"
              >
                <Clock className="h-3 w-3" />
                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
              </button>

              {/* Clear Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Secondary Filter Line: Channel Pills & Contact Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-border/60">
            {/* Channel Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-muted-foreground font-medium mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Channel:
              </span>
              {(['all', 'call', 'email', 'sms', 'whatsapp', 'instagram', 'note'] as const).map(
                (ch) => (
                  <button
                    key={ch}
                    type="button"
                    onClick={() => setTypeFilter(ch)}
                    className={`px-2.5 py-1 rounded-lg border text-xs font-medium capitalize transition-all whitespace-nowrap ${
                      typeFilter === ch
                        ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                        : 'border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }`}
                  >
                    {ch === 'all' ? 'All Channels' : ch}
                  </button>
                )
              )}
            </div>

            {/* Contact Dropdown Filter */}
            <div className="w-full sm:w-60 shrink-0">
              <Select
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Contacts' },
                  ...contacts.map((c) => ({
                    value: c.id,
                    label: `${c.firstName} ${c.lastName || ''}`,
                  })),
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactions Feed */}
      {interactions.length === 0 ? (
        <EmptyState
          title="No messages found"
          description={
            hasActiveFilters
              ? 'No communication records match your current filter criteria. Try resetting filters.'
              : 'Log your first client message to start tracking unified communication history.'
          }
          actionLabel="Log Message"
          onAction={() => {
            setComposerContactId(undefined);
            setComposerChannel('call');
            setIsComposerOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {interactions.map((item) => {
            const contact = contacts.find((c) => c.id === item.contactId);
            const { icon, label, badgeClass } = getChannelBadge(item.type);
            const isExpanded = expandedIds.has(item.id);
            const isLongMessage = item.message.length > 220;

            return (
              <Card key={item.id} hoverEffect className="transition-all">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                    {/* Channel Icon Box */}
                    <div className="p-2.5 rounded-xl bg-muted/60 border border-border flex-shrink-0 mt-0.5">
                      {icon}
                    </div>

                    <div className="min-w-0 space-y-1.5 flex-1">
                      {/* Top Badges & Subject */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-sm sm:text-base text-foreground">
                          {item.subject}
                        </h4>

                        {/* Channel Pill */}
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${badgeClass}`}
                        >
                          {icon}
                          {label}
                        </span>

                        {/* Direction Badge */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">
                          {item.direction === 'outgoing' ? (
                            <ArrowUpRight className="h-3 w-3 text-blue-500" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                          )}
                          {item.direction}
                        </span>

                        {/* Call Outcome if available */}
                        {item.outcome && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            {item.outcome}
                          </span>
                        )}

                        {/* Status */}
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">
                          {item.status}
                        </span>
                      </div>

                      {/* Message Content with Collapsible Expand */}
                      <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {isLongMessage && !isExpanded
                          ? `${item.message.slice(0, 220)}...`
                          : item.message}
                      </div>

                      {isLongMessage && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(item.id)}
                          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 mt-0.5"
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

                      {/* Contact Association Link */}
                      {contact && (
                        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
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

                  {/* Right Column: Timestamps & Quick Actions */}
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

                    {/* Action Buttons: Reply/Follow-up & Delete */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {contact && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenComposerForContact(contact.id, item.type)}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                          title={`Log another touchpoint with ${contact.firstName}`}
                        >
                          <Reply className="h-3.5 w-3.5 mr-1" />
                          Follow-up
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInteractionToDelete(item)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete interaction record"
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

      {/* Dynamic Interaction Composer Modal */}
      <InteractionComposerModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        preselectedContactId={composerContactId}
        defaultChannel={composerChannel}
        onSuccess={() => {
          setIsComposerOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(interactionToDelete)}
        onClose={() => setInteractionToDelete(null)}
        title="Delete Message Record"
        description={`Are you sure you want to delete this ${interactionToDelete?.type} record? This action cannot be undone.`}
        confirmText="Delete Record"
        variant="destructive"
        onConfirm={handleDeleteInteraction}
        isLoading={deleteInteractionMutation.isPending}
      />
    </div>
  );
}
