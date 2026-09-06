import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MessageSquare,
  MessageCircle,
  Instagram,
  Globe,
  MapPin,
  User,
  Calendar,
  Clock,
  Plus,
  FileText,
  Tag,
  X,
  CalendarCheck,
  ExternalLink,
  MoreVertical,
  Layers,
  ChevronDown,
  ChevronUp,
  Reply,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import {
  useContact,
  useGroups,
  useContactInteractions,
  useContactFollowUps,
  useToggleFavorite,
  useDeleteContact,
  useUpdateContact,
  useLogInteraction,
  useDeleteInteraction,
  useCreateFollowUp,
  useToggleFollowUp,
  useAddContactTag,
  useRemoveContactTag,
} from '../hooks/useCRM';
import { Button } from '../components/ui/Button';
import { Avatar } from '../components/ui/Avatar';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { CommunicationBar } from '../components/communication/CommunicationBar';
import { ContactFormModal } from '../components/contacts/ContactFormModal';
import { InteractionComposerModal } from '../components/interactions/InteractionComposerModal';
import { AddFollowUpModal } from '../components/followups/AddFollowUpModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { formatDate, formatDateTime, formatRelativeTime, groupItemsByDate } from '../utils/dateUtils';
import { useToast } from '../components/ui/Toast';
import { Interaction, FollowUp, InteractionType } from '../types';

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: contact, isLoading } = useContact(id);
  const { data: groups = [] } = useGroups();
  const { data: interactions = [] } = useContactInteractions(id);
  const { data: followUps = [] } = useContactFollowUps(id);

  const toggleFavorite = useToggleFavorite();
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();
  const logInteraction = useLogInteraction();
  const deleteInteractionMutation = useDeleteInteraction();
  const createFollowUp = useCreateFollowUp();
  const toggleFollowUp = useToggleFollowUp();
  const addContactTag = useAddContactTag();
  const removeContactTag = useRemoveContactTag();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'timeline' | 'followups' | 'notes'>('timeline');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isAddFollowUpOpen, setIsAddFollowUpOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<InteractionType>('call');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [interactionToDelete, setInteractionToDelete] = useState<Interaction | null>(null);

  // Inline Tag Input
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Inline Notes
  const [notesText, setNotesText] = useState(contact?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Sync notes text when contact changes
  React.useEffect(() => {
    if (contact?.notes !== undefined) {
      setNotesText(contact.notes || '');
    }
  }, [contact?.notes]);

  if (isLoading) {
    return (
      <div className="py-24 text-center text-sm text-muted-foreground animate-pulse">
        Loading contact profile...
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center space-y-4 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <User className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">Contact Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The requested contact record does not exist, was removed, or the ID is invalid.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/contacts')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Contacts Directory
          </Button>
        </div>
      </div>
    );
  }

  const assignedGroups = groups.filter((g) => contact.groupIds.includes(g.id));

  const filteredInteractions = (interactions as Interaction[]).filter((i: Interaction) =>
    channelFilter === 'all' ? true : i.type === channelFilter
  );

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contact.id);
      success('Contact deleted', `${contact.firstName} ${contact.lastName || ''} was removed`);
      navigate('/contacts');
    } catch {
      error('Failed to delete contact');
    }
  };

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

  const handleDeleteInteraction = async () => {
    if (!interactionToDelete) return;
    try {
      await deleteInteractionMutation.mutateAsync(interactionToDelete.id);
      success('Interaction deleted', 'Record removed from timeline');
      setInteractionToDelete(null);
    } catch {
      error('Failed to delete interaction');
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSavingNotes(true);
      await updateContact.mutateAsync({
        id: contact.id,
        updates: { notes: notesText.trim() },
      });
      success('Notes updated', 'Contact internal notes updated');
    } catch {
      error('Failed to update notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newTagInput.trim();
    if (!clean) return;

    try {
      await addContactTag.mutateAsync({ contactId: contact.id, tag: clean });
      success('Tag added', `Added #${clean}`);
      setNewTagInput('');
      setIsAddingTag(false);
    } catch {
      error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      await removeContactTag.mutateAsync({ contactId: contact.id, tag: tagToRemove });
      success('Tag removed', `Removed #${tagToRemove}`);
    } catch {
      error('Failed to remove tag');
    }
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <Phone className="h-4 w-4 text-emerald-500" />;
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'instagram':
        return <Instagram className="h-4 w-4 text-pink-500" />;
      default:
        return <FileText className="h-4 w-4 text-zinc-500" />;
    }
  };

  const moreMenuItems = [
    {
      label: 'Log Interaction',
      icon: <Clock className="h-4 w-4" />,
      onClick: () => {
        setSelectedChannel('call');
        setIsLogModalOpen(true);
      },
    },
    {
      label: 'Schedule Follow-up',
      icon: <CalendarCheck className="h-4 w-4" />,
      onClick: () => setIsAddFollowUpOpen(true),
    },
    {
      label: contact.favorite ? 'Unfavorite' : 'Mark as Favorite',
      icon: <Star className="h-4 w-4" />,
      onClick: () => toggleFavorite.mutate(contact.id),
    },
    { separator: true, label: '', onClick: () => {} },
    {
      label: 'Delete Contact',
      icon: <Trash2 className="h-4 w-4" />,
      destructive: true,
      onClick: () => setIsDeleteDialogOpen(true),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/contacts')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          className="text-muted-foreground hover:text-foreground"
        >
          Back to Contacts
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={toggleFavorite.isPending}
            onClick={() => {
              if (!toggleFavorite.isPending) toggleFavorite.mutate(contact.id);
            }}
            className={contact.favorite ? 'text-amber-500 font-semibold border-amber-300' : ''}
          >
            <Star
              className={`h-4 w-4 mr-1.5 ${
                contact.favorite ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'
              }`}
            />
            {contact.favorite ? 'Favorited' : 'Favorite'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit2 className="h-3.5 w-3.5" />}
          >
            Edit Profile
          </Button>

          <DropdownMenu
            trigger={
              <button
                type="button"
                className="rounded-lg border border-border bg-background p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            }
            items={moreMenuItems}
          />
        </div>
      </div>

      {/* Profile Header Banner */}
      <Card className="relative overflow-hidden bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            {/* Identity Details */}
            <div className="flex items-start space-x-4 sm:space-x-5">
              <Avatar
                src={contact.avatar}
                firstName={contact.firstName}
                lastName={contact.lastName}
                size="2xl"
                className="ring-4 ring-background shadow-md flex-shrink-0"
              />

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                    {contact.firstName} {contact.lastName || ''}
                  </h1>
                  <StatusBadge status={contact.status} />
                </div>

                <p className="text-sm font-medium text-foreground/80">
                  {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
                  <span className="font-semibold text-primary">{contact.company || 'Private Entity'}</span>
                </p>

                {assignedGroups.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {assignedGroups.map((g) => (
                      <span
                        key={g.id}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-background border border-border text-foreground shadow-xs"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: g.color }}
                        />
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Communication Action Row */}
            <div className="flex flex-col items-start md:items-end gap-2.5 border-t md:border-t-0 pt-4 md:pt-0 border-border/70">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                One-Click Multi-Channel Launcher
              </span>
              <CommunicationBar
                contact={contact}
                size="default"
                onLogInteraction={(ch) => {
                  setSelectedChannel(ch as InteractionType);
                  setIsLogModalOpen(true);
                }}
              />
              <span className="text-[11px] text-muted-foreground">
                Last outreach: {formatRelativeTime(contact.lastContactedAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Layout: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact Profile Info & Tags */}
        <div className="space-y-6">
          {/* Profile Information Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs sm:text-sm">
              {/* Phone */}
              <div className="flex items-start space-x-3">
                <Phone className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Phone</p>
                  <a
                    href={`tel:${contact.phone}`}
                    className="font-medium text-foreground hover:text-primary transition-colors block truncate"
                  >
                    {contact.phone}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start space-x-3">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Email</p>
                  {contact.email ? (
                    <a
                      href={`mailto:${contact.email}`}
                      className="font-medium text-foreground hover:text-primary transition-colors block truncate"
                    >
                      {contact.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not provided</span>
                  )}
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start space-x-3">
                <MessageCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">WhatsApp Number</p>
                  <span className="font-medium text-foreground block truncate">
                    {contact.whatsapp || contact.phone || 'Not set'}
                  </span>
                </div>
              </div>

              {/* Instagram Profile */}
              <div className="flex items-start space-x-3">
                <Instagram className="h-4 w-4 text-pink-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Instagram Profile</p>
                  {contact.instagram ? (
                    <a
                      href={`https://instagram.com/${contact.instagram.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-pink-600 hover:underline flex items-center gap-1 truncate"
                    >
                      @{contact.instagram.replace(/^@/, '')}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground">Not connected</span>
                  )}
                </div>
              </div>

              {/* Company & Role */}
              <div className="pt-2 border-t border-border/70 space-y-2">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Company</p>
                  <p className="font-medium text-foreground">{contact.company || '—'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase">Job Title</p>
                  <p className="font-medium text-foreground">{contact.jobTitle || '—'}</p>
                </div>
              </div>

              {/* Website */}
              {contact.website && (
                <div className="flex items-start space-x-3">
                  <Globe className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Website</p>
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary hover:underline block truncate"
                    >
                      {contact.website}
                    </a>
                  </div>
                </div>
              )}

              {/* Address */}
              {contact.address && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-4 w-4 text-zinc-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">Office Location</p>
                    <span className="font-medium text-foreground block">
                      {contact.address}
                    </span>
                  </div>
                </div>
              )}

              {/* System Metadata */}
              <div className="pt-3 border-t border-border/70 space-y-1 text-[11px] text-muted-foreground">
                <p>Created: {formatDate(contact.createdAt)}</p>
                <p>Updated: {formatDate(contact.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Tags Section with Inline Add/Remove */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-primary" /> Contact Tags
              </CardTitle>
              {!isAddingTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAddingTag(true)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Tag
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {isAddingTag && (
                <form onSubmit={handleAddTag} className="flex items-center gap-1.5 animate-fade-in">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Tag name..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-background px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button type="submit" size="sm" className="h-7 px-2.5 text-xs">
                    Add
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddingTag(false)}
                    className="h-7 px-1.5"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </form>
              )}

              <div className="flex flex-wrap gap-1.5">
                {contact.tags.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No tags assigned yet.</p>
                ) : (
                  contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground text-xs font-medium border border-border/60"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="opacity-60 group-hover:opacity-100 hover:text-destructive transition-opacity"
                        title={`Remove tag #${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity Center (Timeline, Follow-ups, Notes) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            {/* Tab navigation bar */}
            <div className="flex items-center justify-between border-b border-border px-6 pt-3">
              <div className="flex items-center space-x-6">
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`py-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'timeline'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Activity Timeline ({interactions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('followups')}
                  className={`py-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'followups'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Follow-ups ({followUps.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className={`py-3 text-sm font-semibold border-b-2 transition-all ${
                    activeTab === 'notes'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Relationship Notes
                </button>
              </div>

              {/* Tab CTA button */}
              {activeTab === 'timeline' && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => {
                    setSelectedChannel('call');
                    setIsLogModalOpen(true);
                  }}
                >
                  Log Touchpoint
                </Button>
              )}

              {activeTab === 'followups' && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                  onClick={() => setIsAddFollowUpOpen(true)}
                >
                  Add Follow-up
                </Button>
              )}
            </div>

            <CardContent className="p-6">
              {/* TAB 1: CHRONOLOGICAL ACTIVITY TIMELINE */}
              {activeTab === 'timeline' && (
                <div className="space-y-4">
                  {/* Channel filter pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {['all', 'call', 'email', 'sms', 'whatsapp', 'instagram', 'note'].map((ch) => (
                      <button
                        key={ch}
                        onClick={() => setChannelFilter(ch)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium capitalize transition-all whitespace-nowrap ${
                          channelFilter === ch
                            ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {ch === 'all' ? 'All Channels' : ch}
                      </button>
                    ))}
                  </div>

                  {filteredInteractions.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      No interactions recorded for this filter.
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {groupItemsByDate(filteredInteractions as Interaction[]).map((group) => (
                        <div key={group.label} className="space-y-3">
                          {/* Date Group Heading */}
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60 uppercase tracking-wider">
                              {group.label}
                            </span>
                            <div className="h-px flex-1 bg-border/60" />
                            <span className="text-[11px] text-muted-foreground font-medium">
                              {group.items.length} {group.items.length === 1 ? 'event' : 'events'}
                            </span>
                          </div>

                          {/* Items in this date group */}
                          <div className="space-y-3">
                            {group.items.map((item: Interaction) => {
                              const isExpanded = expandedIds.has(item.id);
                              const isLong = item.message.length > 200;

                              return (
                                <div
                                  key={item.id}
                                  className="relative flex items-start space-x-3 rounded-xl border border-border/70 bg-card hover:bg-muted/10 p-4 transition-all shadow-xs"
                                >
                                  <div className="p-2.5 rounded-xl bg-muted/60 border border-border flex-shrink-0 mt-0.5 shadow-xs">
                                    {getChannelIcon(item.type)}
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex flex-wrap items-center justify-between gap-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-semibold text-foreground">
                                          {item.subject}
                                        </h4>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground capitalize">
                                          {item.direction === 'outgoing' ? (
                                            <ArrowUpRight className="h-3 w-3 text-blue-500" />
                                          ) : (
                                            <ArrowDownLeft className="h-3 w-3 text-emerald-500" />
                                          )}
                                          {item.direction}
                                        </span>
                                        {item.outcome && (
                                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            {item.outcome}
                                          </span>
                                        )}
                                        <span className="capitalize px-1.5 py-0.5 rounded bg-muted text-[11px] text-muted-foreground">
                                          {item.status}
                                        </span>
                                      </div>

                                      <span
                                        className="text-xs text-muted-foreground flex items-center gap-1 cursor-help"
                                        title={formatDateTime(item.createdAt)}
                                      >
                                        <Clock className="h-3 w-3" />
                                        {formatRelativeTime(item.createdAt)}
                                      </span>
                                    </div>

                                    {/* Message Text with Expand/Collapse */}
                                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                      {isLong && !isExpanded
                                        ? `${item.message.slice(0, 200)}...`
                                        : item.message}
                                    </p>

                                    {isLong && (
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

                                    {/* Quick Actions Footer */}
                                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedChannel(item.type);
                                          setIsLogModalOpen(true);
                                        }}
                                        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                                      >
                                        <Reply className="h-3 w-3 mr-1" />
                                        Follow-up
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setInteractionToDelete(item)}
                                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        title="Delete interaction log"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: FOLLOW-UPS CHECKLIST */}
              {activeTab === 'followups' && (
                <div className="space-y-3">
                  {followUps.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground">
                      No follow-ups scheduled for this contact.
                    </div>
                  ) : (
                    (followUps as FollowUp[]).map((f: FollowUp) => (
                      <div
                        key={f.id}
                        className={`flex items-start space-x-3 rounded-xl border p-3.5 transition-all ${
                          f.completed
                            ? 'border-border/40 bg-muted/20 opacity-70'
                            : 'border-border bg-card shadow-xs'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={f.completed}
                          onChange={() => toggleFollowUp.mutate(f.id)}
                          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm font-semibold ${
                                f.completed ? 'line-through text-muted-foreground' : 'text-foreground'
                              }`}
                            >
                              {f.title}
                            </p>
                            <PriorityBadge priority={f.priority} />
                          </div>
                          {f.notes && (
                            <p className="text-xs text-muted-foreground mt-1">{f.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1 font-medium">
                            <Calendar className="h-3 w-3" /> Due {formatDate(f.dueDate)} ({formatRelativeTime(f.dueDate)})
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: RELATIONSHIP NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <textarea
                    rows={8}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Capture meeting transcripts, background notes, client preferences, budget parameters..."
                    className="w-full rounded-xl border border-input bg-background p-3.5 text-xs sm:text-sm text-foreground focus-visible:outline-none focus-visible:ring-1.5 focus-visible:ring-ring leading-relaxed"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Internal context only visible to team members
                    </span>
                    <Button
                      size="sm"
                      onClick={handleSaveNotes}
                      isLoading={isSavingNotes}
                    >
                      Update Notes
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <ContactFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialContact={contact}
        onSubmit={async (data) => {
          try {
            await updateContact.mutateAsync({ id: contact.id, updates: data });
            success('Profile updated', 'Contact changes updated successfully');
            setIsEditModalOpen(false);
          } catch {
            error('Failed to update contact');
          }
        }}
      />

      {/* Interaction Composer Modal */}
      <InteractionComposerModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        preselectedContactId={contact.id}
        defaultChannel={selectedChannel}
        onSuccess={() => {
          setIsLogModalOpen(false);
        }}
      />

      {/* Add Follow-up Modal */}
      <AddFollowUpModal
        isOpen={isAddFollowUpOpen}
        onClose={() => setIsAddFollowUpOpen(false)}
        preselectedContactId={contact.id}
        onSubmit={async (data) => {
          try {
            await createFollowUp.mutateAsync(data);
            success('Follow-up scheduled', 'Action item created');
            setIsAddFollowUpOpen(false);
          } catch {
            error('Failed to schedule follow-up');
          }
        }}
      />

      {/* Delete Contact Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Contact Profile"
        description={`Are you sure you want to permanently delete ${contact.firstName} ${contact.lastName || ''}? All associated interaction logs and scheduled follow-ups will be erased.`}
        confirmText="Delete Contact"
        isLoading={deleteContact.isPending}
      />

      {/* Delete Interaction Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(interactionToDelete)}
        onClose={() => setInteractionToDelete(null)}
        onConfirm={handleDeleteInteraction}
        title="Delete Interaction Record"
        description={`Are you sure you want to delete this ${interactionToDelete?.type} record from the timeline?`}
        confirmText="Delete Record"
        isLoading={deleteInteractionMutation.isPending}
      />
    </div>
  );
}
