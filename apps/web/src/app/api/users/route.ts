import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getPool } from '@/lib/pg';

export async function GET() {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin.from('app_user').select('id, email, full_name').order('created_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }
  const pool = getPool();
  const { rows } = await pool.query('select id, email, full_name from app_user order by created_at');
  return NextResponse.json({ items: rows });
}


