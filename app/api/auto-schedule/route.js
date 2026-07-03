import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '../../../lib/supabaseServer';
import { getPeriodRange, getCalendarWeeks, formatDateISO } from '../../../lib/period';
import { computeAutoSchedule } from '../../../lib/autoSchedule';

// 指定した期間（16日〜翌月15日）の自動決定ロジックを実行し、
// 手動固定されていない日だけを計算し直して保存する
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const refDate = body.date ? new Date(body.date) : new Date();

  const { start, end } = getPeriodRange(refDate);
  const weeks = getCalendarWeeks(start, end); // 前後の端数週も含む
  const contextDates = weeks.flat().map((d) => formatDateISO(d));
  const contextStart = contextDates[0];
  const contextEnd = contextDates[contextDates.length - 1];
  const periodStart = formatDateISO(start);
  const periodEnd = formatDateISO(end);

  const supabase = getSupabaseServerClient();

  const [holidaysRes, salaryRes, eventsRes, existingRes] = await Promise.all([
    supabase.from('colleague_holidays').select('date').gte('date', contextStart).lte('date', contextEnd),
    supabase.from('salary_days').select('date, type').gte('date', contextStart).lte('date', contextEnd),
    supabase.from('private_events').select('date').gte('date', contextStart).lte('date', contextEnd),
    supabase
      .from('schedule_days')
      .select('date, status, reason, manual_fixed')
      .gte('date', contextStart)
      .lte('date', contextEnd),
  ]);

  const firstError =
    holidaysRes.error || salaryRes.error || eventsRes.error || existingRes.error;
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  const colleagueHolidays = new Set((holidaysRes.data || []).map((r) => r.date));

  const salaryDays = new Map();
  (salaryRes.data || []).forEach((r) => {
    if (!salaryDays.has(r.date)) salaryDays.set(r.date, []);
    salaryDays.get(r.date).push(r.type);
  });

  const privateEvents = new Set((eventsRes.data || []).map((r) => r.date));

  const existingDays = new Map();
  (existingRes.data || []).forEach((r) => {
    existingDays.set(r.date, { status: r.status, reason: r.reason, manual_fixed: r.manual_fixed });
  });

  const updates = computeAutoSchedule({
    contextDates,
    periodStart,
    periodEnd,
    existingDays,
    colleagueHolidays,
    salaryDays,
    privateEvents,
  });

  if (updates.length > 0) {
    const rows = updates.map((u) => ({
      date: u.date,
      status: u.status,
      reason: u.reason,
      manual_fixed: false,
      updated_at: new Date().toISOString(),
    }));
    const { error: upsertError } = await supabase.from('schedule_days').upsert(rows);
    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, updated: updates.length });
}
