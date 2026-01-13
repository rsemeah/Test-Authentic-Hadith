'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Note {
  id: string;
  hadith_id: string;
  content: string;
  created_at: string;
  hadith_text?: string;
  hadith_translation?: string;
  collection?: string;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedHadithId, setSelectedHadithId] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notes');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setNotes(data.notes || []);
    } catch (err) {
      setError('Failed to load notes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const response = await fetch('/api/user/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hadith_id: selectedHadithId,
          content: newNote,
        }),
      });

      if (!response.ok) throw new Error('Failed to create note');
      
      setNewNote('');
      setSelectedHadithId('');
      await fetchNotes();
    } catch (err) {
      setError('Failed to save note');
      console.error(err);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const response = await fetch('/api/user/notes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note_id: noteId }),
      });

      if (!response.ok) throw new Error('Failed to delete');
      await fetchNotes();
    } catch (err) {
      setError('Failed to delete note');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-4xl font-playfair font-bold mb-8">Study Notes</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card animate-pulse h-24 bg-islamic-darker" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-playfair font-bold mb-2">Study Notes</h1>
        <p className="text-gray-400">
          Keep a personal journal of your hadith studies and reflections
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-red-400 mb-8">
          {error}
        </div>
      )}

      {/* Add Note Form */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Add a Note</h2>
        <form onSubmit={handleAddNote} className="space-y-4">
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Write your thoughts and reflections here..."
            className="input-base w-full h-32 resize-none"
          />
          <div className="flex gap-4">
            <input
              type="text"
              value={selectedHadithId}
              onChange={(e) => setSelectedHadithId(e.target.value)}
              placeholder="Hadith ID (optional)"
              className="input-base flex-1"
            />
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="btn-gold px-8 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Note
            </button>
          </div>
        </form>
      </div>

      {/* Notes List */}
      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="card-hover p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {note.hadith_text && (
                    <p className="text-sm text-gold mb-2 line-clamp-1">
                      {note.hadith_text}
                    </p>
                  )}
                  <p className="text-gray-300 leading-relaxed">
                    {note.content}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  className="text-gray-500 hover:text-red-400 transition ml-4 flex-shrink-0"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  {new Date(note.created_at).toLocaleDateString()}
                </p>
                {note.hadith_id && (
                  <Link
                    href={`/hadith/${note.hadith_id}`}
                    className="text-sm text-gold hover:text-gold-dark transition"
                  >
                    View Hadith →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">📝</p>
          <p className="text-gray-400 mb-6">No notes yet</p>
          <p className="text-sm text-gray-500">
            Start taking notes on hadith to build your study journal
          </p>
        </div>
      )}
    </div>
  );
}
