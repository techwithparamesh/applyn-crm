import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-16 w-16',
};

const dotSizeClasses = {
  sm: 'h-2.5 w-2.5 border',
  md: 'h-3 w-3 border-2',
  lg: 'h-4 w-4 border-2',
};

const textSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({ name, avatarUrl, status, size = 'md', className }: UserAvatarProps) {
  const initials = getInitials(name || '??');

  return (
    <div className={cn('relative inline-flex', className)}>
      <Avatar className={cn(sizeClasses[size], 'border border-border')}>
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
        ) : null}
        <AvatarFallback className={cn('gradient-brand text-primary-foreground font-semibold', textSizeClasses[size])}>
          {initials}
        </AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-background',
            dotSizeClasses[size],
            status === 'online' ? 'bg-emerald-500' : 'bg-muted-foreground/40'
          )}
        />
      )}
    </div>
  );
}
