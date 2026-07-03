import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';

// 手動編集の保存（出勤／半日出勤／休日を選んだとき）
export async function POST(request) {
  const { date, status } = await request.json();

  if (!date || !status) {
    return NextResponse.json({ error: 'date, status は必須です' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('schedule_days').upsert({
    date,
    status,
    reason: 'manual',
    manual_fixed: true,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// 「未設定に戻す」（手動固定を解除して空欄に戻す）
export async function DELETE(request) {
  const { date } = await request.json();

  if (!date) {
    return NextResponse.json({ error: 'date は必須です' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('schedule_days').delete().eq('date', date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
