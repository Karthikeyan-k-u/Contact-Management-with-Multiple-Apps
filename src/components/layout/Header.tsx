import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { DropdownMenu } from '../ui/DropdownMenu';
import { useTheme } from '../../context/ThemeContext';
import { useUserProfile } from '../../context/UserProfileContext';
import { useFollowUps } from '../../hooks/useCRM';
import { formatDate } from '../../lib/utils';

export interface HeaderProps {
  onOpenMobileNav: () => void;
  onOpenAddContact: () => void;
  onOpenSearch: () => void;
}

export function Header({
  onOpenMobileNav,
  onOpenAddContact,
  onOpenSearch,
}: HeaderProps) {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { profile } = useUserProfile();
  const { data: followUps = [] } = useFollowUps({ status: 'pending' });
  const [showNotifications, setShowNotifications] = useState(false);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const userMenuItems = [
    {
      label: `${profile.name} (${profile.role})`,
      onClick: () => {},
      disabled: true,
    },
    {
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      label: 'Documentation & Guides',
      onClick: () => window.open('https://github.com', '_blank', 'noopener,noreferrer'),
    },
    { separator: true, label: '', onClick: () => {} },
    {
      label: 'Sign Out (Demo)',
      destructive: true,
      onClick: () => {},
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-md transition-colors">
      {/* Left side: mobile hamburger + global search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="flex lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Global search trigger */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="group flex w-full max-w-sm items-center justify-between rounded-xl border border-input bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground hover:border-foreground/25 hover:bg-muted/60 transition-all shadow-xs"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground" />
            <span className="truncate">Search contacts, companies, tags...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right side: Actions, Notifications, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* + Add Contact Primary Action */}
        <Button
          onClick={onOpenAddContact}
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          className="shadow-sm font-medium"
        >
          <span className="hidden sm:inline">Add Contact</span>
          <span className="sm:hidden">Add</span>
        </Button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications((prev) => !prev)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {followUps.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div
              className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-elevation animate-fade-in z-50"
              onMouseLeave={() => setShowNotifications(false)}
            >
              <div className="flex items-center justify-between pb-2 border-b border-border/70">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Follow-up Reminders ({followUps.length})
                </h4>
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/follow-ups');
                  }}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View All
                </button>
              </div>

              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                {followUps.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    All caught up! No pending follow-ups.
                  </p>
                ) : (
                  followUps.slice(0, 4).map((f) => (
                    <div
                      key={f.id}
                      onClick={() => {
                        setShowNotifications(false);
                        navigate('/follow-ups');
                      }}
                      className="group flex items-start gap-2.5 rounded-lg p-2 hover:bg-muted/60 cursor-pointer transition-colors"
                    >
                      <Calendar className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate group-hover:text-primary">
                          {f.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Due {formatDate(f.dueDate)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-zinc-600" />
          )}
        </button>

        {/* User Profile Menu */}
        <DropdownMenu
          trigger={
            <button className="flex items-center rounded-full ring-2 ring-transparent hover:ring-primary/20 transition-all">
              <Avatar
                name={profile.name}
                size="sm"
                status="online"
                src={profile.avatar}
              />
            </button>
          }
          items={userMenuItems}
          align="right"
        />
      </div>
    </header>
  );
}
