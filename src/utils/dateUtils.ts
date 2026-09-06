/**
 * Date and Time Utilities for CRM interactions and timelines.
 */

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '—';
  }
}

export function formatRelativeTime(dateString?: string | null): string {
  if (!dateString) return 'Never';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Never';

    const now = new Date();
    const diffInSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 0) {
      const futureDiff = Math.abs(diffInSeconds);
      if (futureDiff < 60) return 'Just now';
      if (futureDiff < 3600) return `In ${Math.floor(futureDiff / 60)}m`;
      if (futureDiff < 86400) return `In ${Math.floor(futureDiff / 3600)}h`;
      if (futureDiff < 172800) return 'Tomorrow';
      const days = Math.floor(futureDiff / 86400);
      if (days < 30) return `In ${days} days`;
      return formatDate(dateString);
    }

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 172800) return 'Yesterday';
    const days = Math.floor(diffInSeconds / 86400);
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return formatDate(dateString);
  } catch {
    return 'Never';
  }
}

export type DateFilterRange = 'all' | 'today' | '7days' | '30days';

export function isWithinDateRange(dateString: string, range: DateFilterRange): boolean {
  if (range === 'all') return true;

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  const now = new Date();

  if (range === 'today') {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    return date >= todayStart && date < todayEnd;
  }

  if (range === '7days') {
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return date >= sevenDaysAgo && date <= now;
  }

  if (range === '30days') {
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return date >= thirtyDaysAgo && date <= now;
  }

  return true;
}

export interface DateGroup<T> {
  label: string;
  items: T[];
}

export function groupItemsByDate<T extends { createdAt: string }>(items: T[]): DateGroup<T>[] {
  const groups: Record<string, T[]> = {
    Today: [],
    Yesterday: [],
    'This Week': [],
    'Earlier This Month': [],
    Older: [],
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
  const monthStart = todayStart - 29 * 24 * 60 * 60 * 1000;

  for (const item of items) {
    const time = new Date(item.createdAt).getTime();

    if (time >= todayStart) {
      groups.Today.push(item);
    } else if (time >= yesterdayStart) {
      groups.Yesterday.push(item);
    } else if (time >= weekStart) {
      groups['This Week'].push(item);
    } else if (time >= monthStart) {
      groups['Earlier This Month'].push(item);
    } else {
      groups.Older.push(item);
    }
  }

  return Object.entries(groups)
    .filter(([_, groupItems]) => groupItems.length > 0)
    .map(([label, groupItems]) => ({ label, items: groupItems }));
}
