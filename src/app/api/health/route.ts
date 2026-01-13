/**
 * API Route: Health Check & QBos Connection Status
 */

import { checkQBosConnection } from '@/lib/qbos/truth';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      qbos: false,
      supabase: false,
    },
  };

  try {
    // Check QBos connection
    health.services.qbos = await checkQBosConnection();

    // Check Supabase connection
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.from('users').select('id').limit(1);
    health.services.supabase = !error;

    return NextResponse.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { ...health, status: 'error' },
      { status: 500 }
    );
  }
}
