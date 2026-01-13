'use client';

import Link from 'next/link';
import { useState } from 'react';

interface SearchResult {
  id: string;
  text: string;
  translation: string;
  narrator: string;
  collection: string;
  grade: 'Sahih' | 'Hasan' | 'Da\'if';
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    try {
      const response = await fetch('/api/hadith/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 20 }),
      });

      const data = await response.json();
      setResults(data.hadith || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

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
      <h1 className="text-4xl font-playfair font-bold mb-2">Search Hadith</h1>
      <p className="text-gray-400 mb-8">
        Find hadith by keyword, narrator, or topic
      </p>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by text, narrator, or topic..."
            className="input-base pr-14"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gold hover:text-gold/80 disabled:opacity-50"
          >
            🔍
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <>
          <p className="text-gray-400 mb-6">
            {loading ? 'Searching...' : `Found ${results.length} results`}
          </p>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="card animate-pulse h-32 bg-islamic-darker"
                />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">No results found. Try different keywords.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={`/hadith/${result.id}`}
                  className="card-hover group block"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`badge ${getGradeBadgeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                        <span className="text-xs text-gray-500">
                          {result.collection}
                        </span>
                      </div>

                      <p className="font-arabic text-lg text-gold mb-2 line-clamp-2">
                        {result.text}
                      </p>

                      <p className="text-gray-300 mb-2 line-clamp-2">
                        {result.translation}
                      </p>

                      <p className="text-sm text-gray-500">
                        Narrator: {result.narrator}
                      </p>
                    </div>
                    <span className="text-gold text-lg group-hover:translate-x-1 transition">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {!searched && (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-4 text-lg">🔍</p>
          <p>Enter a search query to find hadith</p>
        </div>
      )}
    </div>
  );
}
