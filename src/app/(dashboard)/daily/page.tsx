'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface DailyHadith {
  id: string;
  text: string;
  translation: string;
  narrator: string;
  collection: string;
  book: string;
  grade: 'Sahih' | 'Hasan' | 'Da\'if';
  number: number;
  reflection?: string;
}

export default function DailyPage() {
  const [hadith, setHadith] = useState<DailyHadith | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchDaily = async () => {
      try {
        const response = await fetch('/api/hadith/daily');
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        setHadith(data.hadith);

        // Check if already saved
        if (data.hadith?.id) {
          const checkResponse = await fetch(`/api/user/saved?hadith_id=${data.hadith.id}`);
          if (checkResponse.ok) {
            setSaved(true);
          }
        }
      } catch (err) {
        setError('Failed to load daily hadith');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDaily();
  }, []);

  const handleSave = async () => {
    if (!hadith?.id) return;

    try {
      if (saved) {
        await fetch('/api/user/saved', {
          method: 'DELETE',
          body: JSON.stringify({ hadith_id: hadith.id }),
        });
        setSaved(false);
      } else {
        await fetch('/api/user/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hadith_id: hadith.id }),
        });
        setSaved(true);
      }
    } catch (err) {
      console.error('Failed to save hadith', err);
    }
  };

  const getDifferenceDays = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getBadgeColor = (grade: string) => {
    switch (grade) {
      case 'Sahih':
        return 'badge-sahih';
      case 'Hasan':
        return 'badge-hasan';
      case 'Da\'if':
        return 'badge-daif';
      default:
        return 'badge-hasan';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="card animate-pulse h-96 bg-islamic-darker" />
      </div>
    );
  }

  if (!hadith) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
          {error || 'Failed to load daily hadith'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-playfair font-bold">Daily Hadith</h1>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <p className="text-gray-400">
          Reflect on this authentic hadith and strengthen your Islamic knowledge
        </p>
      </div>

      {/* Main Card */}
      <div className="card mb-8">
        {/* Metadata */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-700">
          <div className="flex items-center gap-4">
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${getBadgeColor(hadith.grade)}`}>
              {hadith.grade}
            </span>
            <span className="text-sm text-gray-400">
              {hadith.collection} • Hadith #{hadith.number}
            </span>
          </div>
          <button
            onClick={handleSave}
            className="text-2xl hover:scale-125 transition-transform"
          >
            {saved ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Arabic Text */}
        <div className="mb-8 p-6 bg-black/30 rounded-lg">
          <p className="font-arabic text-2xl leading-relaxed text-right dir-rtl">
            {hadith.text}
          </p>
          <p className="text-sm text-gold mt-4 text-right">
            Narrator: {hadith.narrator}
          </p>
        </div>

        {/* English Translation */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">Translation</h3>
          <p className="text-gray-300 leading-relaxed">
            {hadith.translation}
          </p>
        </div>

        {/* Reflection */}
        {hadith.reflection && (
          <div className="mb-8 p-6 bg-gold/10 border border-gold/20 rounded-lg">
            <h3 className="text-lg font-semibold text-gold mb-3">Daily Reflection</h3>
            <p className="text-gray-300 leading-relaxed">
              {hadith.reflection}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t border-gray-700">
          <Link
            href={`/hadith/${hadith.id}`}
            className="flex-1 btn-outline text-center"
          >
            View Full Details
          </Link>
          <Link
            href="/search"
            className="flex-1 btn-gold text-center"
          >
            Explore More
          </Link>
        </div>
      </div>

      {/* Tip Card */}
      <div className="card bg-emerald-bright/10 border border-emerald-bright/20">
        <p className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <span className="text-gray-300">
            Take a moment to reflect on this hadith's meaning and how you can apply its lessons
            to your daily life.
          </span>
        </p>
      </div>
    </div>
  );
}
