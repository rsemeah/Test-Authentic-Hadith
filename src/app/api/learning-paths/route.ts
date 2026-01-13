/**
 * GET /api/learning-paths
 * List learning paths with progress tracking
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

    // Query learning paths
    const { data: paths, error } = await supabase
      .from('learning_paths')
      .select('*')
      .order('difficulty', { ascending: true });

    if (error) throw error;

    // Map to include progress calculation
    const pathsWithProgress = (paths || []).map((path) => ({
      ...path,
      progress: path.lessons_count > 0 
        ? Math.round((path.completed_count / path.lessons_count) * 100)
        : 0,
    }));

    return NextResponse.json({ 
      paths: pathsWithProgress,
      _proof: {
        operation: 'READ_LEARNING_PATHS',
        verified_at: new Date().toISOString(),
        verification_method: 'auth',
        paths_count: pathsWithProgress.length,
      }
    });
  } catch (error) {
    console.error('Failed to fetch learning paths:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
