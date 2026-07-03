import Link from 'next/link';
import { getSupabaseServerClient } from '../lib/supabaseServer';
import { getPeriodRange, getCalendarWeeks, formatDateISO } from '../lib/period';
import CalendarGrid from '../components/CalendarGrid';

export default async function Home({ searchParams }) {
  const refDate = searchParams?.date ? new Date(searchParams.date) : new Date();
  const { start, end, label } = getPeriodRange(refDate);
  const weeks = getCalendarWeeks(start, end);

  const rangeStart = formatDateISO(weeks[0][0]);
  const rangeEnd = formatDateISO(weeks[weeks.length - 1][6]);

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('schedule_days')
    .select('*')
    .gte('date', rangeStart)
    .lte('date', rangeEnd);

  const dayMap = {};
  (data || []).forEach((row) => {
    dayMap[row.date] = row;
  });

  const prevDate = new Date(start);
  prevDate.setDate(prevDate.getDate() - 1);
  const nextDate = new Date(end);
  nextDate.setDate(nextDate.getDate() + 1);

  const cells = weeks.flat().map((date) => {
    const iso = formatDateISO(date);
    const row = dayMap[iso];
    return {
      iso,
      dayNumber: date.getDate(),
      inPeriod: date >= start && date <= end,
      status: row?.status || null,
      manualFixed: !!row?.manual_fixed,
    };
  });

  return (
    <main className="calendar-page">
      <h1>スケジュール管理アプリ</h1>

      <div className="period-nav">
        <Link href={`/?date=${formatDateISO(prevDate)}`}>← 前の期間</Link>
        <span className="period-label">{label}</span>
        <Link href={`/?date=${formatDateISO(nextDate)}`}>次の期間 →</Link>
      </div>

      {error && (
        <p className="error">データの取得に失敗しました：{error.message}</p>
      )}

      <CalendarGrid cells={cells} />

      <p className="note">
        マス目をタップすると、出勤／半日出勤／休日を手動で設定できます。
      </p>
    </main>
  );
}
