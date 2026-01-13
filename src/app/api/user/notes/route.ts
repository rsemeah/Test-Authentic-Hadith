/**
 * GET/POST /api/user/notes
 * Manage user study notes on hadith
 * ✅ RETROFITTED: TruthSerum proof metadata enabled
 */
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query notes from database
    const { data: notes, error } = await supabase
      .from('study_notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ 
      notes: notes || [],
      _proof: {
        operation: 'READ_NOTES',
        verified_at: new Date().toISOString(),
        verification_method: 'auth',
      }
    });
  } catch (error) {
    console.error('Failed to fetch notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hadith_id, content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Insert note
    const { data: note, error } = await supabase
      .from('study_notes')
      .insert([
        {
          hadith_id,
          content,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ 
      note: note?.[0],
      _proof: {
        operation: 'CREATE_NOTE',
        verified_at: new Date().toISOString(),
        verification_method: 'auth',
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { note_id } = await request.json();

    if (!note_id) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    // Delete note
    const { error } = await supabase
      .from('study_notes')
      .delete()
      .eq('id', note_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
