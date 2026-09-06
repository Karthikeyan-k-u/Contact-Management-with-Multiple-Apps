import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarCheck,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Instagram,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFollowUps } from '../../hooks/useCRM';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({ collapsed, onToggleCollapse, className }: SidebarProps) {
  const location = useLocation();
  const { data: followUps = [] } = useFollowUps({ status: 'pending' });
  const pendingCount = followUps.length;

  const navItems = [
    {
      to: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      to: '/contacts',
      label: 'Contacts',
      icon: Users,
      badge: null,
    },
    {
      to: '/groups',
      label: 'Groups',
      icon: FolderKanban,
      badge: null,
    },
    {
      to: '/calls',
      label: 'Calls',
      icon: Phone,
      badge: null,
    },
    {
      to: '/emails',
      label: 'Email',
      icon: Mail,
      badge: null,
    },
    {
      to: '/sms',
      label: 'SMS',
      icon: MessageSquare,
      badge: null,
    },
    {
      to: '/whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      badge: null,
    },
    {
      to: '/instagram',
      label: 'Instagram',
      icon: Instagram,
      badge: null,
    },
    {
      to: '/follow-ups',
      label: 'Follow-ups',
      icon: CalendarCheck,
      badge: pendingCount > 0 ? pendingCount : null,
      badgeVariant: 'warning',
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const isItemActive = (item: { to: string }) => {
    if (item.to === '/') return location.pathname === '/';
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  };

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className="flex items-center space-x-2.5 overflow-hidden">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-sm">
            <img src="/logo.png" alt="ComHub" className="h-9 w-9 object-cover" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <span className="font-bold text-sm tracking-tight text-foreground block">
                ComHub
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider block">
                Workspaces Pro
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 space-y-1 p-2.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                isItemActive(item)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
                  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  'h-4 w-4 flex-shrink-0 transition-colors',
                  collapsed ? 'mx-auto' : 'mr-3'
                )}
              />
              {!collapsed && (
                <span className="flex-1 truncate tracking-tight">{item.label}</span>
              )}
              {!collapsed && item.badge !== null && (
                <span className="ml-auto rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-2 border-t border-sidebar-border hidden lg:block">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex w-full items-center justify-between text-xs px-2 font-medium">
              <span>Collapse sidebar</span>
              <ChevronLeft className="h-4 w-4" />
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
