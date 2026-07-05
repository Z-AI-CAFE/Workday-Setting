import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

const VALID_TYPES = ['monk_prep', 'monk_pay', 'staff_prep', 'staff_pay'];

export async function GET() {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('salary_days')
    .select('date, type')
    .order('date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ items: data || [] });
}

export async function POST(request) {
  const { date, type } = await request.json();
  if (!date || !VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'date, type(4種類) は必須です' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('salary_days').upsert({ date, type });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const { date, type } = await request.json();
  if (!date || !type) {
    return NextResponse.json({ error: 'date, type は必須です' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('salary_days').delete().eq('date', date).eq('type', type);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
