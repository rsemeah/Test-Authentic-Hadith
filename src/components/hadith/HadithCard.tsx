/**
 * HadithCard Component
 * Displays hadith preview in lists
 */

'use client';

import Link from 'next/link';

interface HadithCardProps {
  hadith: {
    id: string;
    hadith_number: string;
    arabic_text: string;
    english_translation: string;
    grade?: string;
    collection?: {
      name_english: string;
      name_arabic: string;
    };
    book?: {
      name_english: string;
      book_number: number;
    };
  };
  onSave?: (hadithId: string) => void;
  isSaved?: boolean;
}

const gradeColors: Record<string, string> = {
  sahih: 'bg-green-900/30 text-green-400 border-green-500',
  hasan: 'bg-blue-900/30 text-blue-400 border-blue-500',
  daif: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
  mawdu: 'bg-red-900/30 text-red-400 border-red-500',
};

export default function HadithCard({ hadith, onSave, isSaved }: HadithCardProps) {
  const gradeColor = gradeColors[hadith.grade?.toLowerCase() || ''] || 'bg-gray-800 text-gray-400 border-gray-600';

  return (
    <div className="bg-islamic-dark border border-gray-800 rounded-lg p-6 hover:border-gold-600 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-gold-500 text-sm font-medium">
            {hadith.collection?.name_english}
          </p>
          <p className="text-gray-400 text-xs mt-1">
            {hadith.book?.name_english} • Hadith #{hadith.hadith_number}
          </p>
        </div>
        {hadith.grade && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${gradeColor}`}>
            {hadith.grade.charAt(0).toUpperCase() + hadith.grade.slice(1)}
          </span>
        )}
      </div>

      {/* Arabic Text */}
      <p
        className="font-arabic text-right text-xl leading-relaxed mb-4 text-gray-100"
        dir="rtl"
        lang="ar"
      >
        {hadith.arabic_text.length > 200
          ? hadith.arabic_text.substring(0, 200) + '...'
          : hadith.arabic_text}
      </p>

      {/* English Translation */}
      <p className="text-gray-300 text-sm leading-relaxed mb-4">
        {hadith.english_translation.length > 300
          ? hadith.english_translation.substring(0, 300) + '...'
          : hadith.english_translation}
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between mt-6">
        <Link
          href={`/hadith/${hadith.id}`}
          className="text-gold-500 hover:text-gold-400 text-sm font-medium transition-colors"
        >
          Read Full Hadith →
        </Link>

        {onSave && (
          <button
            onClick={() => onSave(hadith.id)}
            className={`p-2 rounded-lg transition-colors ${
              isSaved
                ? 'text-gold-500 bg-gold-500/10'
                : 'text-gray-400 hover:text-gold-500 hover:bg-gold-500/10'
            }`}
            aria-label={isSaved ? 'Remove bookmark' : 'Bookmark hadith'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill={isSaved ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
