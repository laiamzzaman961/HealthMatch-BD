import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { error } = await supabase.from('areas').select('id').limit(1);
    if (error) {
      return NextResponse.json(
        { status: 'error', db: 'failed', message: error.message },
        { status: 503 }
      );
    }
    return NextResponse.json({ status: 'ok', db: 'connected' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { status: 'error', db: 'failed', message: msg },
      { status: 503 }
    );
  }
}
