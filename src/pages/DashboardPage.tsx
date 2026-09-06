import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  CalendarCheck,
  Activity,
  Plus,
  ArrowRight,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Star,
  FolderKanban,
  TrendingUp,
  PhoneCall,
  Mail,
  MessageSquare,
  MessageCircle,
  Instagram,
  FileText,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useContacts,
  useInteractions,
  useFollowUps,
  useGroups,
  useToggleFollowUp,
  useCreateContact,
  useLogInteraction,
  useCreateFollowUp,
  useCreateGroup,
  useToggleFavorite,
} from '../hooks/useCRM';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { CommunicationBar } from '../components/communication/CommunicationBar';
import { ContactFormModal } from '../components/contacts/ContactFormModal';
import { InteractionComposerModal } from '../components/interactions/InteractionComposerModal';
import { AddFollowUpModal } from '../components/followups/AddFollowUpModal';
import { AddGroupModal } from '../components/groups/AddGroupModal';
import { formatDate, formatRelativeTime } from '../utils/dateUtils';
import { useToast } from '../components/ui/Toast';
import { ContactStatus, InteractionType } from '../types';

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: contacts = [] } = useContacts();
  const { data: interactions = [] } = useInteractions();
  const { data: followUps = [] } = useFollowUps();
  const { data: groups = [] } = useGroups();

  const toggleFollowUp = useToggleFollowUp();
  const createContact = useCreateContact();
  const createFollowUp = useCreateFollowUp();
  const createGroup = useCreateGroup();
  const toggleFavorite = useToggleFavorite();
  const { success, error } = useToast();

  // Modals state
  const [addContactModal, setAddContactModal] = useState(false);
  const [logInteractionModal, setLogInteractionModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | undefined>(undefined);
  const [addFollowUpModal, setAddFollowUpModal] = useState(false);
  const [addGroupModal, setAddGroupModal] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<InteractionType>('call');

  // KPI calculations
  const totalContacts = contacts.length;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newContactsThisMonth = contacts.filter(
    (c) => new Date(c.createdAt) >= thirtyDaysAgo
  ).length;

  const now = new Date();
  const pendingFollowUps = followUps.filter((f) => !f.completed);
  const overdueFollowUps = pendingFollowUps.filter((f) => new Date(f.dueDate) < now);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const interactionsThisWeek = interactions.filter(
    (i) => new Date(i.createdAt) >= sevenDaysAgo
  ).length;

  // Favorites
  const favoriteContacts = contacts.filter((c) => c.favorite);

  // Status distribution
  const statusCounts: Record<ContactStatus, number> = {
    VIP: contacts.filter((c) => c.status === 'VIP').length,
    Customer: contacts.filter((c) => c.status === 'Customer').length,
    Lead: contacts.filter((c) => c.status === 'Lead').length,
    Prospect: contacts.filter((c) => c.status === 'Prospect').length,
    Inactive: contacts.filter((c) => c.status === 'Inactive').length,
  };

  const statusColors: Record<ContactStatus, string> = {
    VIP: 'bg-purple-500',
    Customer: 'bg-emerald-500',
    Lead: 'bg-blue-500',
    Prospect: 'bg-amber-500',
    Inactive: 'bg-zinc-400 dark:bg-zinc-600',
  };

  const handleToggleFollowUp = async (id: string, currentCompleted: boolean) => {
    try {
      await toggleFollowUp.mutateAsync(id);
      success(
        currentCompleted ? 'Follow-up reopened' : 'Follow-up completed',
        'Updated reminder status'
      );
    } catch {
      error('Failed to update follow-up');
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall className="h-3.5 w-3.5 text-emerald-500" />;
      case 'email':
        return <Mail className="h-3.5 w-3.5 text-blue-500" />;
      case 'sms':
        return <MessageSquare className="h-3.5 w-3.5 text-purple-500" />;
      case 'whatsapp':
        return <MessageCircle className="h-3.5 w-3.5 text-green-500" />;
      case 'instagram':
        return <Instagram className="h-3.5 w-3.5 text-pink-500" />;
      default:
        return <FileText className="h-3.5 w-3.5 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header & Quick Action Suite */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Executive Dashboard
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Monitor client pipeline health, track touchpoints, and dispatch instant multi-channel communication
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={() => setAddContactModal(true)}
          >
            Add Contact
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Activity className="h-3.5 w-3.5" />}
            onClick={() => {
              setSelectedContactId(undefined);
              setSelectedChannel('call');
              setLogInteractionModal(true);
            }}
          >
            Log Interaction
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<CalendarCheck className="h-3.5 w-3.5" />}
            onClick={() => setAddFollowUpModal(true)}
          >
            Create Follow-up
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<FolderKanban className="h-3.5 w-3.5" />}
            onClick={() => setAddGroupModal(true)}
          >
            Add Group
          </Button>
        </div>
      </div>

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Contacts */}
        <Card
          hoverEffect
          className="cursor-pointer transition-all"
          onClick={() => navigate('/contacts')}
        >
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Contacts
              </span>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {totalContacts}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+12% this quarter</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: New Contacts This Month */}
        <Card
          hoverEffect
          className="cursor-pointer transition-all"
          onClick={() => navigate('/contacts')}
        >
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                New Contacts
              </span>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {newContactsThisMonth}
              </div>
              <div className="text-xs text-muted-foreground">
                Added in last 30 days
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <UserPlus className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Follow-ups Due */}
        <Card
          hoverEffect
          className="cursor-pointer transition-all"
          onClick={() => navigate('/follow-ups')}
        >
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Follow-ups Due
              </span>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {pendingFollowUps.length}
              </div>
              {overdueFollowUps.length > 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{overdueFollowUps.length} overdue</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>All tasks on schedule</span>
                </div>
              )}
            </div>
            <div
              className={`p-3 rounded-xl ${
                overdueFollowUps.length > 0
                  ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
              }`}
            >
              <CalendarCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Interactions This Week */}
        <Card
          hoverEffect
          className="cursor-pointer transition-all"
          onClick={() => navigate('/messages')}
        >
          <CardContent className="p-5 flex items-start justify-between">
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Interactions (7d)
              </span>
              <div className="text-3xl font-bold tracking-tight text-foreground">
                {interactionsThisWeek}
              </div>
              <div className="text-xs text-muted-foreground">
                Touchpoints recorded
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Summaries: Status & Groups Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contacts by Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Contacts by Lifecycle Status</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Distribution across relationship stages
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/contacts')}
              className="text-xs font-semibold text-primary"
            >
              View Directory
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Multi-Segment Progress Bar */}
            <div className="h-3.5 w-full rounded-full bg-muted/60 overflow-hidden flex">
              {(['VIP', 'Customer', 'Lead', 'Prospect', 'Inactive'] as ContactStatus[]).map((st) => {
                const count = statusCounts[st];
                const pct = totalContacts > 0 ? (count / totalContacts) * 100 : 0;
                if (pct === 0) return null;
                return (
                  <div
                    key={st}
                    style={{ width: `${pct}%` }}
                    className={`${statusColors[st]} transition-all hover:opacity-85 cursor-pointer`}
                    title={`${st}: ${count} (${pct.toFixed(0)}%)`}
                    onClick={() => navigate(`/contacts?status=${st}`)}
                  />
                );
              })}
            </div>

            {/* Legend & Clickable Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-1">
              {(['VIP', 'Customer', 'Lead', 'Prospect', 'Inactive'] as ContactStatus[]).map((st) => {
                const count = statusCounts[st];
                const pct = totalContacts > 0 ? ((count / totalContacts) * 100).toFixed(0) : '0';
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => navigate(`/contacts?status=${st}`)}
                    className="p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 text-left transition-colors"
                  >
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`h-2 w-2 rounded-full ${statusColors[st]}`} />
                      <span>{st}</span>
                    </div>
                    <div className="text-base font-bold text-foreground mt-1">
                      {count}{' '}
                      <span className="text-[11px] font-normal text-muted-foreground">({pct}%)</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Contacts by Group */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-base">Contacts by Group / Segment</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Segmented customer pools and partner accounts
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/groups')}
              className="text-xs font-semibold text-primary"
            >
              Manage Groups
            </Button>
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No groups defined yet. Click &quot;Add Group&quot; to create your first segment.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {groups.map((group) => {
                  const memberCount = contacts.filter((c) => c.groupIds.includes(group.id)).length;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => navigate(`/contacts?groupId=${group.id}`)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-border/70 bg-card hover:bg-muted/40 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="text-xs font-semibold text-foreground truncate">
                          {group.name}
                        </span>
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
                        {memberCount} contacts
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Layout: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols on lg): Recent Contacts & Favorite Contacts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Favorite VIP Contacts */}
          {favoriteContacts.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <CardTitle className="text-base">Starred VIP Accounts</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground font-medium">
                  {favoriteContacts.length} VIPs
                </span>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {favoriteContacts.slice(0, 4).map((contact) => (
                    <div
                      key={contact.id}
                      className="p-3 rounded-xl border border-border/70 bg-muted/10 hover:bg-muted/30 transition-all flex items-center justify-between gap-3"
                    >
                      <div
                        className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                      >
                        <Avatar
                          src={contact.avatar}
                          firstName={contact.firstName}
                          lastName={contact.lastName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-foreground truncate hover:text-primary transition-colors">
                            {contact.firstName} {contact.lastName}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {contact.company || contact.email}
                          </p>
                        </div>
                      </div>

                      <CommunicationBar
                        contact={contact}
                        size="sm"
                        onLogInteraction={(ch) => {
                          setSelectedContactId(contact.id);
                          setSelectedChannel(ch as InteractionType);
                          setLogInteractionModal(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Contacts Table / List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Contacts</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Direct 1-click calls, emails, WhatsApp messages, and social outreach
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/contacts')}
                className="text-xs font-semibold text-primary"
              >
                View all ({totalContacts})
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border/60">
                {contacts.slice(0, 6).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-3 group"
                  >
                    <div
                      className="flex items-center space-x-3 cursor-pointer min-w-0"
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    >
                      <Avatar
                        src={contact.avatar}
                        firstName={contact.firstName}
                        lastName={contact.lastName}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {contact.firstName} {contact.lastName}
                          </span>
                          <StatusBadge status={contact.status} />
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.jobTitle ? `${contact.jobTitle} at ` : ''}
                          <span className="font-medium text-foreground/80">{contact.company || 'Private'}</span>
                          {contact.lastContactedAt && (
                            <span className="ml-1 text-[11px] text-muted-foreground/70">
                              • Last active {formatRelativeTime(contact.lastContactedAt)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 pl-11 sm:pl-0">
                      <CommunicationBar
                        contact={contact}
                        size="sm"
                        onLogInteraction={(channel) => {
                          setSelectedContactId(contact.id);
                          setSelectedChannel(channel as InteractionType);
                          setLogInteractionModal(true);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        title="View profile"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Interactions Activity Feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Recent Activity Feed</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Unified multi-channel communication logs
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/messages')}
                className="text-xs font-semibold text-primary"
              >
                Full History
              </Button>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  No interactions recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {interactions.slice(0, 5).map((item) => {
                    const contact = contacts.find((c) => c.id === item.contactId);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start space-x-3 rounded-xl border border-border/60 bg-muted/20 p-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-card border border-border/80 shrink-0 mt-0.5 shadow-xs">
                          {getChannelIcon(item.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-foreground truncate">
                              {item.subject}
                            </span>
                            <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatRelativeTime(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                            {item.message}
                          </p>
                          {contact && (
                            <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>With:</span>
                              <button
                                onClick={() => navigate(`/contacts/${contact.id}`)}
                                className="font-medium text-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                              >
                                {contact.firstName} {contact.lastName} ({contact.company || contact.email})
                              </button>
                              <span className="capitalize">• {item.direction} {item.type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 Col on lg): Upcoming Follow-ups & Reminders Checklist */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Action items and schedule deadlines
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/follow-ups')}
                className="text-xs font-semibold text-primary"
              >
                View all ({pendingFollowUps.length})
              </Button>
            </CardHeader>
            <CardContent>
              {pendingFollowUps.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto" />
                  <p className="text-xs font-medium text-foreground">All caught up!</p>
                  <p className="text-[11px] text-muted-foreground">No pending follow-up reminders</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingFollowUps.slice(0, 6).map((item) => {
                    const contact = contacts.find((c) => c.id === item.contactId);
                    const isOverdue = new Date(item.dueDate) < now;

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isOverdue
                            ? 'border-rose-300 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/20'
                            : 'border-border bg-card'
                        }`}
                      >
                        <div className="flex items-start space-x-2.5">
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={() => handleToggleFollowUp(item.id, item.completed)}
                            className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-xs font-semibold text-foreground line-clamp-1">
                                {item.title}
                              </h4>
                              <PriorityBadge priority={item.priority} />
                            </div>

                            {contact && (
                              <p className="text-[11px] text-muted-foreground truncate">
                                For{' '}
                                <span
                                  onClick={() => navigate(`/contacts/${contact.id}`)}
                                  className="font-medium text-foreground hover:underline cursor-pointer"
                                >
                                  {contact.firstName} {contact.lastName}
                                </span>
                              </p>
                            )}

                            <div
                              className={`text-[11px] font-medium flex items-center gap-1 pt-1 ${
                                isOverdue
                                  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {isOverdue && <AlertTriangle className="h-3 w-3" />}
                              <span>
                                {isOverdue ? 'Overdue' : 'Due'} {formatDate(item.dueDate)} (
                                {formatRelativeTime(item.dueDate)})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Global Modals */}
      <ContactFormModal
        isOpen={addContactModal}
        onClose={() => setAddContactModal(false)}
        onSubmit={async (data) => {
          try {
            await createContact.mutateAsync(data);
            success('Contact created', `${data.firstName} was added to your contacts`);
            setAddContactModal(false);
          } catch {
            error('Failed to create contact');
          }
        }}
      />

      <InteractionComposerModal
        isOpen={logInteractionModal}
        onClose={() => setLogInteractionModal(false)}
        preselectedContactId={selectedContactId}
        defaultChannel={selectedChannel}
        onSuccess={() => {
          setLogInteractionModal(false);
        }}
      />

      <AddFollowUpModal
        isOpen={addFollowUpModal}
        onClose={() => setAddFollowUpModal(false)}
        onSubmit={async (data) => {
          try {
            await createFollowUp.mutateAsync(data);
            success('Follow-up Scheduled', 'Reminder added to your dashboard');
            setAddFollowUpModal(false);
          } catch {
            error('Failed to create follow-up');
          }
        }}
      />

      <AddGroupModal
        isOpen={addGroupModal}
        onClose={() => setAddGroupModal(false)}
        onSubmit={async (groupData) => {
          try {
            await createGroup.mutateAsync(groupData);
            success('Group Created', `${groupData.name} was added to groups`);
            setAddGroupModal(false);
          } catch {
            error('Failed to create group');
          }
        }}
      />
    </div>
  );
}
