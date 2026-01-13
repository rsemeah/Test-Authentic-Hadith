/**
 * QuotaIndicator Component
 * Shows AI query quota status
 */

'use client';

import { useEffect, useState } from 'react';

interface QuotaIndicatorProps {
  remaining?: number | null;
}

export default function QuotaIndicator({ remaining }: QuotaIndicatorProps) {
  const [quotaStatus, setQuotaStatus] = useState<{
    used: number;
    limit: number;
    remaining: number;
    tier: string;
  } | null>(null);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const response = await fetch('/api/ai/quota');
      if (response.ok) {
        const data = await response.json();
        setQuotaStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch quota:', error);
    }
  };

  const displayRemaining = remaining ?? quotaStatus?.remaining ?? 0;
  const limit = quotaStatus?.limit ?? 5;
  const tier = quotaStatus?.tier ?? 'free';

  if (tier === 'premium' || tier === 'lifetime') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-gold-500/10 border border-gold-500/20 rounded-lg">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 text-gold-500"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-gold-500 text-xs font-medium">Unlimited</span>
      </div>
    );
  }

  const percentage = (displayRemaining / limit) * 100;
  const color =
    percentage > 50
      ? 'text-green-500 border-green-500/20'
      : percentage > 20
      ? 'text-yellow-500 border-yellow-500/20'
      : 'text-red-500 border-red-500/20';

  return (
    <div className={`flex items-center gap-2 px-3 py-1 border rounded-lg ${color} bg-opacity-10`}>
      <div className="relative w-4 h-4">
        <svg className="w-4 h-4 -rotate-90">
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className="opacity-20"
          />
          <circle
            cx="8"
            cy="8"
            r="6"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray={`${(percentage / 100) * 37.7} 37.7`}
          />
        </svg>
      </div>
      <span className="text-xs font-medium">
        {displayRemaining}/{limit} queries
      </span>
    </div>
  );
}
