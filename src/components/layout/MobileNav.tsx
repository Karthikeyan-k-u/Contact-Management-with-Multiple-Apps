import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  X,
  LayoutDashboard,
  Users,
  FolderKanban,
  CalendarCheck,
  Settings,
  MessageCircle,
  Instagram,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';
import { useFollowUps } from '../../hooks/useCRM';
import { cn } from '../../lib/utils';

export interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const location = useLocation();
  const { data: followUps = [] } = useFollowUps({ status: 'pending' });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/contacts', label: 'Contacts', icon: Users },
    { to: '/groups', label: 'Groups', icon: FolderKanban },
    { to: '/calls', label: 'Calls', icon: Phone },
    { to: '/emails', label: 'Email', icon: Mail },
    { to: '/sms', label: 'SMS', icon: MessageSquare },
    { to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle },
    { to: '/instagram', label: 'Instagram', icon: Instagram },
    {
      to: '/follow-ups',
      label: 'Follow-ups',
      icon: CalendarCheck,
      badge: followUps.length > 0 ? followUps.length : null,
    },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const isItemActive = (item: { to: string }) => {
    if (item.to === '/') return location.pathname === '/';
    return location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-sidebar text-sidebar-foreground p-5 shadow-2xl flex flex-col justify-between animate-fade-in">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-5 border-b border-sidebar-border">
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary shadow-sm">
                <img src="/logo.png" alt="ComHub" className="h-9 w-9 object-cover" />
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-foreground block">
                  ComHub
                </span>
                <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                  Mobile Menu
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Links */}
          <nav className="mt-5 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={cn(
                    'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    isItemActive(item)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60'
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-semibold text-amber-600">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-sidebar-border text-xs text-muted-foreground">
          © 2026 ComHub • Contact Management
        </div>
      </div>
    </div>
  );
}
