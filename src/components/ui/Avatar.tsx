import React, { useState } from 'react';
import { cn, getAvatarGradient, getInitials } from '../../lib/utils';

export interface AvatarProps {
  src?: string | null;
  firstName?: string;
  lastName?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  status?: 'online' | 'offline' | 'busy' | null;
}

const sizeClasses = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl font-bold',
};

const statusClasses = {
  online: 'bg-emerald-500',
  offline: 'bg-zinc-400',
  busy: 'bg-amber-500',
};

export function Avatar({
  src,
  firstName = '',
  lastName = '',
  name,
  size = 'md',
  className,
  status = null,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const displayName = name || `${firstName} ${lastName}`.trim() || 'User';
  const initials = getInitials(firstName || displayName.split(' ')[0] || '', lastName || displayName.split(' ')[1] || '');
  const gradient = getAvatarGradient(displayName);

  return (
    <div className={cn('relative inline-flex flex-shrink-0 select-none items-center justify-center rounded-full', sizeClasses[size], className)}>
      {src && !imageError ? (
        <img
          src={src}
          alt={displayName}
          onError={() => setImageError(true)}
          className="h-full w-full rounded-full object-cover shadow-xs"
        />
      ) : (
        <div
          className={cn(
            'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr text-white font-medium shadow-xs',
            gradient
          )}
        >
          {initials}
        </div>
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block rounded-full ring-2 ring-background',
            size === 'xs' || size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5',
            statusClasses[status]
          )}
        />
      )}
    </div>
  );
}
