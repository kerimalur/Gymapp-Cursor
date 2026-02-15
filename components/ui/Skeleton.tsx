'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`skeleton h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: SkeletonProps) {
  return (
    <div className={`card-elevated p-5 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonWorkoutCard() {
  return (
    <div className="card-elevated p-5 space-y-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="card-elevated p-5 animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function SkeletonExerciseCard() {
  return (
    <div className="card-elevated p-5 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ height = 200 }: { height?: number }) {
  return (
    <div className="card-elevated p-5 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="relative" style={{ height }}>
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between py-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-3 w-6" />
          ))}
        </div>
        {/* Chart area */}
        <div className="ml-10 h-full flex items-end gap-2">
          {[0.6, 0.8, 0.5, 0.9, 0.7, 0.85, 0.65].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end">
              <Skeleton 
                className="w-full rounded-t-lg" 
                style={{ height: `${h * 100}%`, animationDelay: `${i * 0.1}s` }}
              />
            </div>
          ))}
        </div>
        {/* X-axis labels */}
        <div className="ml-10 flex justify-between pt-2">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <Skeleton key={day} className="h-3 w-6" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      
      {/* Main Content */}
      <div className="grid md:grid-cols-2 gap-6">
        <SkeletonChart />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <SkeletonWorkoutCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

// Loading Spinner
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Pulse Dot (for live indicators)
export function PulseDot({ color = 'primary' }: { color?: 'primary' | 'success' | 'warning' | 'danger' }) {
  const colorClasses = {
    primary: 'bg-primary-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
  };

  return (
    <span className="relative flex h-3 w-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${colorClasses[color]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-3 w-3 ${colorClasses[color]}`} />
    </span>
  );
}
