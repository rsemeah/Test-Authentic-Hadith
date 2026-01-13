/**
 * HadithDetail Component
 * Full hadith display with narrator chain and metadata
 */

'use client';

interface HadithDetailProps {
  hadith: {
    id: string;
    hadith_number: string;
    arabic_text: string;
    english_translation: string;
    grade?: string;
    narrator_chain?: any;
    topics?: string[];
    collection?: {
      name_english: string;
      name_arabic: string;
      description?: string;
    };
    book?: {
      name_english: string;
      name_arabic: string;
      book_number: number;
    };
  };
  onSave?: (hadithId: string) => void;
  isSaved?: boolean;
}

const gradeInfo: Record<string, { color: string; description: string }> = {
  sahih: {
    color: 'bg-green-900/30 text-green-400 border-green-500',
    description: 'Authentic - Meets all criteria for a sound hadith',
  },
  hasan: {
    color: 'bg-blue-900/30 text-blue-400 border-blue-500',
    description: 'Good - Slightly weaker than Sahih but still acceptable',
  },
  daif: {
    color: 'bg-yellow-900/30 text-yellow-400 border-yellow-500',
    description: 'Weak - Does not meet all criteria for acceptance',
  },
  mawdu: {
    color: 'bg-red-900/30 text-red-400 border-red-500',
    description: 'Fabricated - Not authentic',
  },
};

export default function HadithDetail({ hadith, onSave, isSaved }: HadithDetailProps) {
  const grade = hadith.grade?.toLowerCase() || '';
  const gradeStyle = gradeInfo[grade] || {
    color: 'bg-gray-800 text-gray-400 border-gray-600',
    description: 'Grade not specified',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Collection & Book Info */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gold-500 mb-2">
          {hadith.collection?.name_english}
        </h1>
        <p className="text-gray-400">
          {hadith.book?.name_english} • Hadith #{hadith.hadith_number}
        </p>
      </div>

      {/* Grade Badge */}
      {hadith.grade && (
        <div className="mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${gradeStyle.color}`}>
            <span className="mr-2">●</span>
            {hadith.grade.charAt(0).toUpperCase() + hadith.grade.slice(1)}
          </span>
          <p className="text-gray-400 text-xs mt-2">{gradeStyle.description}</p>
        </div>
      )}

      {/* Arabic Text */}
      <div className="bg-islamic-darker rounded-lg p-8 mb-6 border border-gray-800">
        <p
          className="font-arabic text-right text-2xl leading-[2.5] text-gray-100"
          dir="rtl"
          lang="ar"
        >
          {hadith.arabic_text}
        </p>
      </div>

      {/* English Translation */}
      <div className="bg-islamic-dark rounded-lg p-8 mb-6 border border-gray-800">
        <h2 className="text-gold-500 font-medium mb-4">English Translation</h2>
        <p className="text-gray-300 text-lg leading-relaxed">
          {hadith.english_translation}
        </p>
      </div>

      {/* Topics */}
      {hadith.topics && hadith.topics.length > 0 && (
        <div className="mb-6">
          <h3 className="text-gray-400 text-sm font-medium mb-3">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {hadith.topics.map((topic) => (
              <span
                key={topic}
                className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full hover:bg-gray-700 transition-colors cursor-pointer"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Narrator Chain */}
      {hadith.narrator_chain && (
        <div className="bg-islamic-dark rounded-lg p-6 mb-6 border border-gray-800">
          <h3 className="text-gold-500 font-medium mb-4">Chain of Narration (Isnad)</h3>
          <div className="text-gray-300 text-sm">
            {typeof hadith.narrator_chain === 'string'
              ? hadith.narrator_chain
              : JSON.stringify(hadith.narrator_chain, null, 2)}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-800">
        <div className="flex gap-4">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
            aria-label="Share hadith"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
              />
            </svg>
            Share
          </button>

          {onSave && (
            <button
              onClick={() => onSave(hadith.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isSaved
                  ? 'bg-gold-500/20 text-gold-500 hover:bg-gold-500/30'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
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
              {isSaved ? 'Saved' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
