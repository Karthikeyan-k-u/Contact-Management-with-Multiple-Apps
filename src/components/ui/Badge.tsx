import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { ContactStatus, FollowUpPriority } from '../../types';

export const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary/10 text-primary hover:bg-primary/20',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border-border text-foreground',
        success:
          'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-400',
        warning:
          'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-400',
        destructive:
          'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400',
        purple:
          'border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-400',
        blue:
          'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-400',
      },
      size: {
        sm: 'px-1.5 py-0.2 text-[10px]',
        default: 'px-2 py-0.5 text-xs',
        lg: 'px-2.5 py-1 text-sm font-semibold',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, size, dot = false, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full',
            variant === 'success' && 'bg-emerald-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'destructive' && 'bg-rose-500',
            variant === 'purple' && 'bg-purple-500',
            variant === 'blue' && 'bg-blue-500',
            (!variant || variant === 'default') && 'bg-primary'
          )}
        />
      )}
      {children}
    </div>
  );
}

export function StatusBadge({ status, className }: { status: ContactStatus; className?: string }) {
  const config: Record<ContactStatus, { variant: 'warning' | 'success' | 'blue' | 'purple' | 'secondary'; label: string }> = {
    Lead: { variant: 'warning', label: 'Lead' },
    Customer: { variant: 'success', label: 'Customer' },
    Prospect: { variant: 'blue', label: 'Prospect' },
    VIP: { variant: 'purple', label: 'VIP' },
    Inactive: { variant: 'secondary', label: 'Inactive' },
  };

  const item = config[status] || { variant: 'secondary', label: status };

  return (
    <Badge variant={item.variant} dot className={className}>
      {item.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: FollowUpPriority; className?: string }) {
  const config: Record<FollowUpPriority, { variant: 'destructive' | 'warning' | 'blue' | 'secondary'; label: string }> = {
    urgent: { variant: 'destructive', label: 'Urgent' },
    high: { variant: 'warning', label: 'High' },
    medium: { variant: 'blue', label: 'Medium' },
    low: { variant: 'secondary', label: 'Low' },
  };

  const item = config[priority] || { variant: 'secondary', label: priority };

  return (
    <Badge variant={item.variant} className={className}>
      {item.label}
    </Badge>
  );
}
