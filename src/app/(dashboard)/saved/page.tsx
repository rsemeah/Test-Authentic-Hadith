'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SavedHadith {
  id: string;
  text: string;
  translation: string;
  collection: string;
  grade: string;
  saved_at: string;
}

export default function SavedPage() {
  const [hadith, setHadith] = useState<SavedHadith[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const response = await fetch('/api/user/saved');
        const data = await response.json();
        setHadith(data.hadith || []);
      } catch (err) {
        setError('Failed to load saved hadith');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSaved();
  }, []);

  const handleDelete = async (hadithId: string) => {
    try {
      await fetch('/api/user/saved', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hadith_id: hadithId }),
      });
      setHadith(hadith.filter((h) => h.id !== hadithId));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-playfair font-bold mb-8">Saved Hadith</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-32 bg-islamic-darker" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-playfair font-bold mb-2">Saved Hadith</h1>
      <p className="text-gray-400 mb-8">
        {hadith.length} hadith bookmarked for later study
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-8 text-red-400">
          {error}
        </div>
      )}

      {hadith.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No saved hadith yet</p>
          <Link href="/collections" className="btn-gold">
            Browse Collections
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {hadith.map((h) => (
            <div key={h.id} className="card-hover group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="badge-gold">{h.grade}</span>
                    <span className="text-xs text-gray-500">{h.collection}</span>
                    <span className="text-xs text-gray-600">
                      Saved {new Date(h.saved_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="font-arabic text-lg text-gold mb-2 line-clamp-2">
                    {h.text}
                  </p>

                  <p className="text-gray-300 mb-3 line-clamp-2">
                    {h.translation}
                  </p>

                  <div className="flex gap-3">
                    <Link
                      href={`/hadith/${h.id}`}
                      className="text-sm text-gold hover:text-gold/80"
                    >
                      View Detail
                    </Link>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <span className="text-2xl">❤️</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
