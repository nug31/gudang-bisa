import React from 'react';
import { cn } from '../../utils/cn';
import { User } from 'lucide-react';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  className,
}) => {
  const sizeStyles: Record<AvatarSize, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  // Get initials from name
  const getInitials = (name?: string): string => {
    if (!name) return '';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden inline-flex items-center justify-center bg-neutral-200 text-neutral-700 font-medium flex-shrink-0',
        sizeStyles[size],
        className
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={(e) => {
            // On error, fallback to initials or default icon
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <User className={cn(
          size === 'sm' && 'w-4 h-4',
          size === 'md' && 'w-5 h-5',
          size === 'lg' && 'w-6 h-6',
          size === 'xl' && 'w-8 h-8',
        )} />
      )}
    </div>
  );
};