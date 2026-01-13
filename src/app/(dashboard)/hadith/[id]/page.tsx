'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Hadith {
  id: string;
  text: string;
  translation: string;
  narrator: string;
  narrator_chain?: string[];
  collection: string;
  book: string;
  chapter?: string;
  number: number;
  grade: 'Sahih' | 'Hasan' | 'Da\'if' | 'Mawdu';
  commentary?: string;
}

export default function HadithDetailPage() {
  const params = useParams();
  const hadithId = params.id as string;
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    const fetchHadith = async () => {
      try {
        const response = await fetch(`/api/hadith/${hadithId}`);
        if (!response.ok) throw new Error('Not found');
        const data = await response.json();
        setHadith(data.hadith);
      } catch (err) {
        setError('Failed to load hadith');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (hadithId) fetchHadith();
  }, [hadithId]);

  const handleSaveToggle = async () => {
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      await fetch(`/api/user/saved`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hadith_id: hadithId }),
      });
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="card animate-pulse h-96 bg-islamic-darker" />
      </div>
    );
  }

  if (error || !hadith) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400">
          {error || 'Hadith not found'}
        </div>
        <Link href="/collections" className="mt-6 inline-block btn-outline">
          ← Back to Collections
        </Link>
      </div>
    );
  }

  const getGradeBadgeColor = (grade: string) => {
    switch (grade?.toLowerCase()) {
      case 'sahih':
        return 'badge-sahih';
      case 'hasan':
        return 'badge-hasan';
      case 'daif':
        return 'badge-daif';
      default:
        return 'badge-gold';
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/collections" className="hover:text-gold">
          Collections
        </Link>
        <span>/</span>
        <Link href={`/collections`} className="hover:text-gold">
          {hadith.collection}
        </Link>
        <span>/</span>
        <span>{hadith.number}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold mb-2">
            {hadith.collection} #{hadith.number}
          </h1>
          <div className="flex items-center gap-3">
            <span className={`badge ${getGradeBadgeColor(hadith.grade)}`}>
              {hadith.grade}
            </span>
            {hadith.chapter && (
              <span className="text-sm text-gray-400">{hadith.chapter}</span>
            )}
          </div>
        </div>
        <button
          onClick={handleSaveToggle}
          className="text-3xl hover:scale-110 transition"
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Arabic Text */}
        <div className="card">
          <p className="text-sm text-gray-400 mb-4">Original Arabic</p>
          <p className="font-arabic text-2xl text-gold leading-relaxed">
            {hadith.text}
          </p>
        </div>

        {/* Translation */}
        <div className="card">
          <p className="text-sm text-gray-400 mb-4">English Translation</p>
          <p className="text-lg text-gray-200 leading-relaxed">
            {hadith.translation}
          </p>
        </div>

        {/* Narrator */}
        <div className="card">
          <p className="text-sm text-gray-400 mb-2">Narrator</p>
          <p className="text-white mb-4">{hadith.narrator}</p>
          {hadith.narrator_chain && hadith.narrator_chain.length > 0 && (
            <div className="text-sm text-gray-400">
              <p className="mb-2">Chain of Narration:</p>
              <div className="space-y-1">
                {hadith.narrator_chain.map((narrator, i) => (
                  <div key={i} className="pl-4">
                    {narrator}
                    {i < hadith.narrator_chain!.length - 1 && (
                      <span className="text-gold ml-2">↓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Commentary */}
        {hadith.commentary && (
          <div className="card">
            <p className="text-sm text-gray-400 mb-4">Commentary</p>
            <p className="text-gray-300 leading-relaxed">{hadith.commentary}</p>
          </div>
        )}

        {/* AI Assistant */}
        <div className="card border-gold/30 bg-gradient-to-br from-islamic-darker to-islamic-darker">
          <h3 className="text-lg font-semibold text-gold mb-4">✨ AI Explanation</h3>
          {showAI ? (
            <div className="space-y-4">
              <p className="text-gray-300">
                Loading AI explanation... The SafetyEngine is checking this query first to ensure it remains educational and safe.
              </p>
              <button
                onClick={() => setShowAI(false)}
                className="btn-outline"
              >
                Close
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAI(true)}
              className="btn-gold w-full"
            >
              Ask AI for Explanation
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 mt-12 pt-8 border-t border-gray-700">
        <Link href="/collections" className="btn-outline">
          ← Back to Collections
        </Link>
        <Link href="/search" className="btn-outline">
          Search Hadith
        </Link>
      </div>
    </div>
  );
}
