import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UserPlus,
  Star,
  LayoutGrid,
  List,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Filter,
  ArrowUpDown,
  X,
  Tag,
  Users,
  CheckSquare,
  Square,
  MinusSquare,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { crmStorage } from '../services';
import {
  useContacts,
  useGroups,
  useAllTags,
  useDeleteContact,
  useToggleFavorite,
  useUpdateContact,
  useCreateContact,
  useLogInteraction,
  useBulkDeleteContacts,
  useBulkSetStatus,
  useBulkAssignGroup,
  useBulkAddTag,
} from '../hooks/useCRM';
import { Contact, ContactStatus, InteractionType } from '../types';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { StatusBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Card, CardContent } from '../components/ui/Card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';
import { DropdownMenu } from '../components/ui/DropdownMenu';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { CommunicationBar } from '../components/communication/CommunicationBar';
import { ContactFormModal } from '../components/contacts/ContactFormModal';
import { LogInteractionModal } from '../components/interactions/LogInteractionModal';
import { BulkActionToolbar } from '../components/contacts/BulkActionToolbar';
import { TableRowSkeleton } from '../components/ui/Skeleton';
import { formatRelativeTime } from '../lib/utils';
import { useToast } from '../components/ui/Toast';

const STATUS_FILTERS: (ContactStatus | 'all')[] = [
  'all',
  'Lead',
  'Customer',
  'Prospect',
  'VIP',
  'Inactive',
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'name', label: 'Name (A to Z)' },
  { value: 'nameDesc', label: 'Name (Z to A)' },
  { value: 'company', label: 'Company (A to Z)' },
  { value: 'lastContacted', label: 'Last Contacted' },
  { value: 'status', label: 'Lifecycle Status' },
];

export function ContactsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter & View state from URL / state
  const initialGroupId = searchParams.get('groupId') || 'all';
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<string>(initialGroupId);
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'nameDesc' | 'company' | 'lastContacted' | 'status'>('recent');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Multi-select state
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [logModalContactId, setLogModalContactId] = useState<string | null>(null);
  const [logModalChannel, setLogModalChannel] = useState<InteractionType>('call');

  // Queries
  const { data: contacts = [], isLoading } = useContacts({
    search,
    status: statusFilter,
    groupId: groupFilter,
    tag: tagFilter,
    favoriteOnly,
    sortBy,
  });

  const { data: allContacts = [] } = useContacts();
  const { data: groups = [] } = useGroups();
  const { data: allTags = [] } = useAllTags();

  // Mutations
  const deleteContact = useDeleteContact();
  const toggleFavorite = useToggleFavorite();
  const updateContact = useUpdateContact();
  const createContact = useCreateContact();
  const logInteraction = useLogInteraction();
  const bulkDelete = useBulkDeleteContacts();
  const bulkSetStatus = useBulkSetStatus();
  const bulkAssignGroup = useBulkAssignGroup();
  const bulkAddTag = useBulkAddTag();
  const { success, error } = useToast();

  const isFiltered = useMemo(() => {
    return Boolean(
      search ||
      statusFilter !== 'all' ||
      groupFilter !== 'all' ||
      tagFilter !== 'all' ||
      favoriteOnly
    );
  }, [search, statusFilter, groupFilter, tagFilter, favoriteOnly]);

  const clearAllFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setGroupFilter('all');
    setTagFilter('all');
    setFavoriteOnly(false);
    setSearchParams({});
  };

  // Multi-select helpers
  const isAllSelected = contacts.length > 0 && selectedContactIds.length === contacts.length;
  const isSomeSelected = selectedContactIds.length > 0 && !isAllSelected;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(contacts.map((c) => c.id));
    }
  };

  const toggleSelectContact = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Handlers
  const handleBulkDeleteConfirm = async () => {
    try {
      await bulkDelete.mutateAsync(selectedContactIds);
      success('Contacts deleted', `${selectedContactIds.length} contacts removed`);
      setSelectedContactIds([]);
      setIsBulkDeleteDialogOpen(false);
    } catch {
      error('Failed to delete selected contacts');
    }
  };

  const handleBulkStatus = async (status: ContactStatus) => {
    try {
      await bulkSetStatus.mutateAsync({ ids: selectedContactIds, status });
      success('Status updated', `Updated ${selectedContactIds.length} contacts to ${status}`);
    } catch {
      error('Failed to update status');
    }
  };

  const handleBulkGroup = async (groupId: string) => {
    try {
      await bulkAssignGroup.mutateAsync({ ids: selectedContactIds, groupId });
      const grp = groups.find((g) => g.id === groupId);
      success('Group assigned', `Added ${selectedContactIds.length} contacts to ${grp?.name || 'group'}`);
    } catch {
      error('Failed to assign group');
    }
  };

  const handleBulkTag = async (tag: string) => {
    try {
      await bulkAddTag.mutateAsync({ ids: selectedContactIds, tag });
      success('Tag added', `Tagged ${selectedContactIds.length} contacts with "${tag}"`);
    } catch {
      error('Failed to add tag');
    }
  };

  const handleDeleteSingle = async () => {
    if (!deletingContactId) return;
    try {
      await deleteContact.mutateAsync(deletingContactId);
      success('Contact deleted', 'Contact was removed from your contacts');
      setSelectedContactIds((prev) => prev.filter((id) => id !== deletingContactId));
      setDeletingContactId(null);
    } catch {
      error('Failed to delete contact');
    }
  };

  const handleExportCsv = (mode: 'filtered' | 'all') => {
    const listToExport = mode === 'filtered' ? contacts : allContacts;
    if (listToExport.length === 0) {
      error('No contacts to export', 'The current list has zero records');
      return;
    }

    const csvContent = crmStorage.exportContactsAsCsv(listToExport);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute(
      'download',
      mode === 'filtered' && isFiltered
        ? `nexus_contacts_filtered_${dateStr}.csv`
        : `nexus_contacts_all_${dateStr}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    success(
      'CSV Export Complete',
      `Exported ${listToExport.length} contact ${listToExport.length === 1 ? 'record' : 'records'}`
    );
  };

  const getContactMenuItems = (contact: Contact) => [
    {
      label: 'View Profile',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(`/contacts/${contact.id}`),
    },
    {
      label: 'Edit Contact',
      icon: <Edit2 className="h-4 w-4" />,
      onClick: () => setEditingContact(contact),
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
      onClick: () => setDeletingContactId(contact.id),
    },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Contacts
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {contacts.length} {contacts.length === 1 ? 'record' : 'records'}
              {allContacts.length !== contacts.length && ` (of ${allContacts.length})`}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage your customer database, organization groups, tags, and multi-channel outreach
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Export Button (Filtered vs All) */}
          {isFiltered ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCsv('filtered')}
                className="gap-1.5 text-xs shadow-xs"
                title="Export currently filtered contacts"
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                Export Filtered ({contacts.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExportCsv('all')}
                className="text-xs text-muted-foreground hover:text-foreground hidden sm:inline-flex"
                title="Export all contacts in database"
              >
                All ({allContacts.length})
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExportCsv('all')}
              className="gap-1.5 text-xs shadow-xs"
              title="Export all contacts as CSV"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              Export CSV
            </Button>
          )}

          <Button
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsAddModalOpen(true)}
            className="shadow-sm font-medium"
          >
            Add Contact
          </Button>
        </div>
      </div>

      {/* Main Toolbar & Search Card */}
      <Card>
        <CardContent className="p-4 space-y-3.5">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input with instant matching */}
            <div className="flex-1 max-w-xl">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search across name, email, phone, company, tags..."
              />
            </div>

            {/* Controls: Filter Toggle, Sort, and View Switch */}
            <div className="flex flex-wrap items-center gap-2 justify-between lg:justify-end">
              {/* Filter Button Toggle */}
              <Button
                variant={isFiltered || showAdvancedFilters ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => setShowAdvancedFilters((prev) => !prev)}
                className={`text-xs ${isFiltered ? 'font-semibold border-primary/30 text-primary' : ''}`}
              >
                <Filter className="h-3.5 w-3.5 mr-1.5" />
                Filters {isFiltered && '• Active'}
              </Button>

              {/* Sort Dropdown */}
              <div className="w-44">
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  options={SORT_OPTIONS}
                />
              </div>

              {/* View Switch: List vs. Grid */}
              <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'table'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="List View"
                  aria-label="Switch to list view"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-all ${
                    viewMode === 'grid'
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid View"
                  aria-label="Switch to grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Status Pills Bar */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pt-1">
            <div className="flex items-center gap-1.5 text-xs">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-lg border text-xs font-medium capitalize transition-all whitespace-nowrap ${
                    statusFilter === s
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'border-border/70 bg-background text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  {s === 'all' ? 'All' : s}
                </button>
              ))}
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="h-3 w-3 mr-1" /> Clear Filters
              </Button>
            )}
          </div>

          {/* Collapsible Advanced Filters Drawer */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in">
              {/* Group Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Group
                </label>
                <Select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Groups' },
                    ...groups.map((g) => ({ value: g.id, label: g.name })),
                  ]}
                />
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1 uppercase tracking-wider">
                  Tag
                </label>
                <Select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Tags' },
                    ...allTags.map((t) => ({ value: t, label: `#${t}` })),
                  ]}
                />
              </div>

              {/* Favorites Only */}
              <div className="flex items-end">
                <Button
                  variant={favoriteOnly ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setFavoriteOnly((prev) => !prev)}
                  className={`w-full h-9 justify-center ${favoriteOnly ? 'text-amber-500 font-semibold border-amber-300' : ''}`}
                >
                  <Star
                    className={`h-4 w-4 mr-2 ${favoriteOnly ? 'fill-amber-400 text-amber-500' : 'text-muted-foreground'}`}
                  />
                  {favoriteOnly ? 'Showing Favorites Only' : 'Filter by Favorites'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contacts List / Grid View Rendering */}
      {isLoading ? (
        <Card className="p-6">
          <table className="w-full">
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={7} />
              ))}
            </tbody>
          </table>
        </Card>
      ) : contacts.length === 0 ? (
        <EmptyState
          title={isFiltered ? 'No contacts match your filters' : 'No contacts yet'}
          description={
            isFiltered
              ? `No contacts found matching "${search || statusFilter || groupFilter}". Try clearing your filters.`
              : 'Add your first contact to begin managing client relationships and dispatching communications.'
          }
          actionLabel={isFiltered ? 'Clear Filters' : 'Add First Contact'}
          onAction={isFiltered ? clearAllFilters : () => setIsAddModalOpen(true)}
        />
      ) : viewMode === 'table' ? (
        /* TABLE LIST VIEW */
        <Card className="overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {/* Select All Checkbox */}
                <TableHead className="w-10 pl-4">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="flex items-center text-muted-foreground hover:text-foreground"
                    title={isAllSelected ? 'Deselect all' : 'Select all'}
                    aria-label="Select all contacts"
                  >
                    {isAllSelected ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : isSomeSelected ? (
                      <MinusSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </TableHead>

                <TableHead className="w-8"></TableHead>
                <TableHead className="font-semibold text-foreground">Contact</TableHead>
                <TableHead>Company & Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Direct Channels</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-12 text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => {
                const isSelected = selectedContactIds.includes(contact.id);
                return (
                  <TableRow
                    key={contact.id}
                    className={`cursor-pointer transition-colors group ${
                      isSelected ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted/40'
                    }`}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  >
                    {/* Row selection checkbox */}
                    <TableCell className="pl-4" onClick={(e) => toggleSelectContact(contact.id, e)}>
                      <button
                        type="button"
                        className="flex items-center text-muted-foreground hover:text-foreground"
                        aria-label={`Select ${contact.firstName} ${contact.lastName || ''}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground" />
                        )}
                      </button>
                    </TableCell>

                    {/* Favorite star */}
                    <TableCell
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!toggleFavorite.isPending) toggleFavorite.mutate(contact.id);
                      }}
                    >
                      <Star
                        className={`h-4 w-4 transition-colors ${
                          toggleFavorite.isPending
                            ? 'text-muted-foreground/20'
                            : contact.favorite
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-muted-foreground/30 hover:text-amber-400'
                        }`}
                      />
                    </TableCell>

                    {/* Contact Identity Column (Visually Strongest) */}
                    <TableCell>
                      <div className="flex items-center space-x-3 min-w-[200px]">
                        <Avatar
                          src={contact.avatar}
                          firstName={contact.firstName}
                          lastName={contact.lastName}
                          size="md"
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors block truncate">
                            {contact.firstName} {contact.lastName || ''}
                          </span>
                          <span className="text-xs text-muted-foreground block truncate">
                            {contact.email || 'No email set'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Company & Role */}
                    <TableCell>
                      <div className="min-w-0 max-w-[160px]">
                        <p className="text-sm font-medium text-foreground truncate">
                          {contact.company || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.jobTitle || 'No title'}
                        </p>
                      </div>
                    </TableCell>

                    {/* Phone */}
                    <TableCell className="text-xs font-medium text-foreground/80 whitespace-nowrap">
                      {contact.phone}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusBadge status={contact.status} />
                    </TableCell>

                    {/* Tags */}
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[150px]">
                        {contact.tags.slice(0, 2).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-medium text-muted-foreground"
                          >
                            {t}
                          </span>
                        ))}
                        {contact.tags.length > 2 && (
                          <span className="text-[10px] text-muted-foreground font-medium">
                            +{contact.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Direct Channels Bar */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <CommunicationBar
                        contact={contact}
                        size="sm"
                        onLogInteraction={(ch) => {
                          setLogModalContactId(contact.id);
                          setLogModalChannel(ch as InteractionType);
                        }}
                      />
                    </TableCell>

                    {/* Last Active */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(contact.lastContactedAt)}
                    </TableCell>

                    {/* Action Dropdown Menu */}
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu
                        trigger={
                          <button
                            type="button"
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            aria-label="Open contact actions"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={getContactMenuItems(contact)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contacts.map((contact) => {
            const isSelected = selectedContactIds.includes(contact.id);
            return (
              <Card
                key={contact.id}
                hoverEffect
                className={`cursor-pointer group flex flex-col justify-between transition-all ${
                  isSelected ? 'border-primary/50 ring-2 ring-primary/20 bg-primary/5' : ''
                }`}
                onClick={() => navigate(`/contacts/${contact.id}`)}
              >
                <CardContent className="p-5 space-y-4">
                  {/* Top Header: Checkbox + Avatar + Name + Menu */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Selection checkbox */}
                      <button
                        type="button"
                        onClick={(e) => toggleSelectContact(contact.id, e)}
                        className="text-muted-foreground hover:text-foreground flex-shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4 text-muted-foreground/60" />
                        )}
                      </button>

                      <Avatar
                        src={contact.avatar}
                        firstName={contact.firstName}
                        lastName={contact.lastName}
                        size="lg"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors">
                          {contact.firstName} {contact.lastName || ''}
                        </h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.jobTitle ? `${contact.jobTitle} • ` : ''}
                          {contact.company || 'Private Entity'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          if (!toggleFavorite.isPending) toggleFavorite.mutate(contact.id);
                        }}
                        disabled={toggleFavorite.isPending}
                        className="p-1 rounded-md text-muted-foreground hover:bg-muted disabled:opacity-50"
                      >
                        <Star
                          className={`h-4 w-4 ${
                            contact.favorite
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-muted-foreground/40'
                          }`}
                        />
                      </button>

                      <DropdownMenu
                        trigger={
                          <button className="p-1 rounded-md text-muted-foreground hover:bg-muted">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        }
                        items={getContactMenuItems(contact)}
                      />
                    </div>
                  </div>

                  {/* Core details */}
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p className="truncate">
                      <span className="font-medium text-foreground/70">Phone:</span> {contact.phone}
                    </p>
                    {contact.email && (
                      <p className="truncate">
                        <span className="font-medium text-foreground/70">Email:</span> {contact.email}
                      </p>
                    )}
                    {contact.lastContactedAt && (
                      <p className="text-[11px] text-muted-foreground/80">
                        Last contacted: {formatRelativeTime(contact.lastContactedAt)}
                      </p>
                    )}
                  </div>

                  {/* Tags */}
                  {contact.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.slice(0, 3).map((t, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                      {contact.tags.length > 3 && (
                        <span className="text-[10px] text-muted-foreground font-medium">
                          +{contact.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom Bar: Status + 5-Channel Communication */}
                  <div
                    className="flex items-center justify-between pt-3 border-t border-border/60"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <StatusBadge status={contact.status} />
                    <CommunicationBar
                      contact={contact}
                      size="sm"
                      onLogInteraction={(ch) => {
                        setLogModalContactId(contact.id);
                        setLogModalChannel(ch as InteractionType);
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating Multi-Select Bulk Action Toolbar */}
      <BulkActionToolbar
        selectedCount={selectedContactIds.length}
        groups={groups}
        onDeselectAll={() => setSelectedContactIds([])}
        onSetStatus={handleBulkStatus}
        onAssignGroup={handleBulkGroup}
        onAddTag={handleBulkTag}
        onDelete={() => setIsBulkDeleteDialogOpen(true)}
      />

      {/* Add / Edit Contact Modal */}
      <ContactFormModal
        isOpen={isAddModalOpen || Boolean(editingContact)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingContact(null);
        }}
        initialContact={editingContact}
        onSubmit={async (data) => {
          try {
            if (editingContact) {
              await updateContact.mutateAsync({ id: editingContact.id, updates: data });
              success('Contact updated', `${data.firstName} ${data.lastName || ''} was updated`);
              setEditingContact(null);
            } else {
              await createContact.mutateAsync(data);
              success('Contact created', `${data.firstName} ${data.lastName || ''} was added`);
              setIsAddModalOpen(false);
            }
          } catch {
            error('Failed to save contact');
          }
        }}
        isLoading={createContact.isPending || updateContact.isPending}
      />

      {/* Quick Log Modal from Communication Click */}
      {logModalContactId && (
        <LogInteractionModal
          isOpen={Boolean(logModalContactId)}
          onClose={() => setLogModalContactId(null)}
          preselectedContactId={logModalContactId}
          defaultChannel={logModalChannel}
          onSubmit={async (data) => {
            try {
              await logInteraction.mutateAsync(data);
              success('Interaction logged', 'Timeline updated');
              setLogModalContactId(null);
            } catch {
              error('Failed to log interaction');
            }
          }}
        />
      )}

      {/* Delete Confirmation Dialog (Single Contact) */}
      <ConfirmDialog
        isOpen={Boolean(deletingContactId)}
        onClose={() => setDeletingContactId(null)}
        onConfirm={handleDeleteSingle}
        title="Delete Contact"
        description="Are you sure you want to delete this contact? All associated interaction logs and scheduled follow-ups will also be removed. This action cannot be undone."
        confirmText="Delete Contact"
        isLoading={deleteContact.isPending}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${selectedContactIds.length} Selected Contacts?`}
        description={`You are about to permanently delete ${selectedContactIds.length} contacts and all their associated communication logs. This action cannot be reversed.`}
        confirmText={`Delete ${selectedContactIds.length} Contacts`}
        variant="destructive"
        isLoading={bulkDelete.isPending}
      />
    </div>
  );
}
