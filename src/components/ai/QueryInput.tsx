/**
 * QueryInput Component
 * Input field for AI queries with character limit
 */

'use client';

import { FormEvent, useState } from 'react';

interface QueryInputProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export default function QueryInput({
  onSubmit,
  disabled = false,
  maxLength = 500,
}: QueryInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim() && !disabled) {
      onSubmit(query.trim());
      setQuery('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about this hadith's context, meaning, or historical background..."
          disabled={disabled}
          maxLength={maxLength}
          rows={3}
          className="w-full bg-islamic-darker border border-gray-700 rounded-lg px-4 py-3 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
          {query.length}/{maxLength}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-xs">
          Press Enter or click Send to ask
        </p>
        <button
          type="submit"
          disabled={disabled || !query.trim()}
          className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? 'Sending...' : 'Send'}
        </button>
      </div>
    </form>
  );
}
