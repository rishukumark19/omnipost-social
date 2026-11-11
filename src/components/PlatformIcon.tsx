import React from 'react';
import { Platform } from '@/lib/types';
import { Instagram, Facebook, Twitter, Youtube } from 'lucide-react';

interface PlatformBadgeProps {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function PlatformBadge({ platform, size = 'sm', showLabel = false }: PlatformBadgeProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const config = {
    instagram: {
      name: 'Instagram',
      icon: Instagram,
      bg: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      fill: 'text-pink-400',
    },
    facebook: {
      name: 'Facebook',
      icon: Facebook,
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      fill: 'text-blue-400',
    },
    twitter: {
      name: 'X (Twitter)',
      icon: Twitter,
      bg: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      fill: 'text-sky-400',
    },
    youtube: {
      name: 'YouTube',
      icon: Youtube,
      bg: 'bg-red-500/10 text-red-400 border-red-500/30',
      fill: 'text-red-400',
    },
  }[platform];

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${config.bg}`}
    >
      <Icon className={sizeClasses[size]} />
      {showLabel && <span>{config.name}</span>}
    </span>
  );
}

