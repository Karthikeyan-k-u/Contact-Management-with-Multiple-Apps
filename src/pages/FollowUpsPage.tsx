import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Plus,
  Calendar,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Filter,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Search,
} from 'lucide-react';
import {
  useFollowUps,
  useContacts,
  useToggleFollowUp,
  useDeleteFollowUp,
  useCreateFollowUp,
  useUpdateFollowUp,
} from '../hooks/useCRM';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { PriorityBadge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { SearchInput } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { AddFollowUpModal } from '../components/followups/AddFollowUpModal';
import { formatDate, formatDateTime, formatRelativeTime } from '../utils/dateUtils';
import { FollowUp, FollowUpPriority } from '../types';
import { useToast } from '../components/ui/Toast';

type TabStatus = 'all' | 'pending' | 'today' | 'overdue' | 'upcoming' | 'completed';

export function FollowUpsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabStatus>('pending');
  const [priorityFilter, setPriorityFilter] = useState<FollowUpPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [deletingFollowUp, setDeletingFollowUp] = useState<FollowUp | null>(null);

  // Queries & Mutations
  const { data: allFollowUps = [] } = useFollowUps({ status: 'all' });
  const { data: contacts = [] } = useContacts();

  const toggleFollowUp = useToggleFollowUp();
  const deleteFollowUp = useDeleteFollowUp();
  const createFollowUp = useCreateFollowUp();
  const updateFollowUp = useUpdateFollowUp();
  const { success, error } = useToast();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Counts for each tab
  const counts = {
    pending: allFollowUps.filter((f) => !f.completed).length,
    today: allFollowUps.filter((f) => {
      if (f.completed) return false;
      const d = new Date(f.dueDate);
      return d >= todayStart && d <= todayEnd;
    }).length,
    overdue: allFollowUps.filter((f) => !f.completed && new Date(f.dueDate) < todayStart).length,
    upcoming: allFollowUps.filter((f) => !f.completed && new Date(f.dueDate) > todayEnd).length,
    completed: allFollowUps.filter((f) => f.completed).length,
    all: allFollowUps.length,
  };

  // Filter items by tab, priority, and search
  const filteredFollowUps = allFollowUps.filter((item) => {
    // 1. Tab Status Filter
    if (activeTab === 'pending' && item.completed) return false;
    if (activeTab === 'completed' && !item.completed) return false;
    if (activeTab === 'overdue') {
      if (item.completed || new Date(item.dueDate) >= todayStart) return false;
    }
    if (activeTab === 'today') {
      if (item.completed) return false;
      const d = new Date(item.dueDate);
      if (d < todayStart || d > todayEnd) return false;
    }
    if (activeTab === 'upcoming') {
      if (item.completed || new Date(item.dueDate) <= todayEnd) return false;
    }

    // 2. Priority Filter
    if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

    // 3. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const contact = contacts.find((c) => c.id === item.contactId);
      const contactName = contact ? `${contact.firstName} ${contact.lastName || ''}`.toLowerCase() : '';
      const company = contact?.company ? contact.company.toLowerCase() : '';
      const titleMatches = item.title.toLowerCase().includes(q);
      const notesMatches = (item.notes || '').toLowerCase().includes(q);
      const contactMatches = contactName.includes(q) || company.includes(q);

      if (!titleMatches && !notesMatches && !contactMatches) return false;
    }

    return true;
  });

  const handleToggle = async (id: string, currentCompleted: boolean) => {
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

  const handleSaveFollowUp = async (data: Omit<FollowUp, 'id'>) => {
    try {
      if (editingFollowUp) {
        await updateFollowUp.mutateAsync({
          id: editingFollowUp.id,
          updates: data,
        });
        success('Follow-up updated', 'Reminder changes updated');
        setEditingFollowUp(null);
      } else {
        await createFollowUp.mutateAsync(data);
        success('Follow-up scheduled', 'Action item created');
        setIsAddModalOpen(false);
      }
    } catch {
      error('Failed to save follow-up');
    }
  };

  const handleDelete = async () => {
    if (!deletingFollowUp) return;
    try {
      await deleteFollowUp.mutateAsync(deletingFollowUp.id);
      success('Follow-up deleted', 'Reminder removed from schedule');
      setDeletingFollowUp(null);
    } catch {
      error('Failed to delete follow-up');
    }
  };

  const tabs: { id: TabStatus; label: string; count: number; alert?: boolean }[] = [
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'today', label: 'Due Today', count: counts.today },
    { id: 'overdue', label: 'Overdue', count: counts.overdue, alert: counts.overdue > 0 },
    { id: 'upcoming', label: 'Upcoming', count: counts.upcoming },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'all', label: 'All Tasks', count: counts.all },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Follow-up Reminders
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Action items, schedule deadlines, and ensure no customer or prospect slips through the cracks
          </p>
        </div>

        <Button
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => {
            setEditingFollowUp(null);
            setIsAddModalOpen(true);
          }}
          className="shadow-xs"
        >
          New Follow-up
        </Button>
      </div>

      {/* Segmented Controls Card */}
      <Card>
        <CardContent className="p-4 space-y-3.5">
          {/* Top Search and Status Tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="w-full md:max-w-sm">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search title, contact, or notes..."
              />
            </div>

            {/* Status Tabs */}
            <div className="flex rounded-lg border border-border bg-muted/40 p-1 text-xs overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      tab.alert
                        ? 'bg-rose-500 text-white'
                        : activeTab === tab.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Priority filter pills */}
          <div className="flex items-center justify-between pt-1 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto py-0.5">
              <span className="text-muted-foreground font-medium flex items-center gap-1 mr-1">
                <Filter className="h-3 w-3" /> Priority:
              </span>
              {(['all', 'urgent', 'high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-medium capitalize transition-all ${
                    priorityFilter === p
                      ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                      : 'border-border/70 bg-background text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Clear search
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Follow-ups List */}
      {filteredFollowUps.length === 0 ? (
        <EmptyState
          title="No follow-ups found"
          description={
            searchQuery || priorityFilter !== 'all'
              ? 'No reminders match your filter criteria. Try clearing search or selecting another tab.'
              : activeTab === 'completed'
              ? 'Completed tasks will appear here after you finish them.'
              : activeTab === 'overdue'
              ? 'Great job! You have zero overdue tasks.'
              : 'All caught up! There are no follow-ups scheduled in this view.'
          }
          actionLabel="Create Follow-up"
          onAction={() => {
            setEditingFollowUp(null);
            setIsAddModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {filteredFollowUps.map((item) => {
            const contact = contacts.find((c) => c.id === item.contactId);
            const isOverdue = !item.completed && new Date(item.dueDate) < todayStart;
            const isDueToday =
              !item.completed &&
              new Date(item.dueDate) >= todayStart &&
              new Date(item.dueDate) <= todayEnd;

            return (
              <Card
                key={item.id}
                hoverEffect
                className={`transition-all ${
                  item.completed
                    ? 'opacity-70 bg-muted/20 border-border/60'
                    : isOverdue
                    ? 'border-rose-300 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                    : isDueToday
                    ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10'
                    : ''
                }`}
              >
                <CardContent className="p-4 sm:p-5 flex items-start space-x-3.5">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => handleToggle(item.id, item.completed)}
                    className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer shrink-0"
                    title={item.completed ? 'Mark pending' : 'Mark completed'}
                  />

                  {/* Body */}
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm sm:text-base font-semibold ${
                            item.completed
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white uppercase tracking-wider">
                            Overdue
                          </span>
                        )}
                        {isDueToday && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider">
                            Due Today
                          </span>
                        )}
                      </div>

                      <PriorityBadge priority={item.priority} />
                    </div>

                    {item.notes && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {item.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-border/50 gap-2 text-xs text-muted-foreground">
                      {/* Contact Info Link */}
                      {contact ? (
                        <div className="flex items-center gap-1.5">
                          <span>With:</span>
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
                      ) : (
                        <span />
                      )}

                      {/* Due Date & Action Buttons */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue
                              ? 'text-rose-600 dark:text-rose-400 font-semibold'
                              : isDueToday
                              ? 'text-amber-600 dark:text-amber-400 font-semibold'
                              : 'text-foreground/80'
                          }`}
                          title={formatDateTime(item.dueDate)}
                        >
                          {isOverdue ? (
                            <AlertTriangle className="h-3.5 w-3.5" />
                          ) : (
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          Due {formatDate(item.dueDate)} ({formatRelativeTime(item.dueDate)})
                        </span>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFollowUp(item)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit follow-up"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingFollowUp(item)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete reminder"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Follow-up Modal */}
      <AddFollowUpModal
        isOpen={isAddModalOpen || Boolean(editingFollowUp)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingFollowUp(null);
        }}
        initialFollowUp={editingFollowUp}
        onSubmit={handleSaveFollowUp}
        isLoading={createFollowUp.isPending || updateFollowUp.isPending}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingFollowUp)}
        onClose={() => setDeletingFollowUp(null)}
        title="Delete Follow-up Reminder"
        description={`Are you sure you want to delete "${deletingFollowUp?.title}"? This task will be removed from your schedule.`}
        confirmText="Delete Reminder"
        variant="destructive"
        onConfirm={handleDelete}
        isLoading={deleteFollowUp.isPending}
      />
    </div>
  );
}
