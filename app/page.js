import Link from 'next/link';
import { getSupabaseServerClient } from '../lib/supabaseServer';
import { getPeriodRange, getCalendarWeeks, formatDateISO } from '../lib/period';

const STATUS_LABEL = {
  full_work: '出勤',
  half_work: '半日出勤',
  day_off: '休日',
  needs_confirmation: '要確認',
};

const STATUS_CLASS = {
  full_work: 'status-full',
  half_work: 'status-half',
  day_off: 'status-off',
  needs_confirmation: 'status-conflict',
};

const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

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

      <div className="calendar-grid">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="weekday-header">
            {w}
          </div>
        ))}
        {weeks.flat().map((date) => {
          const iso = formatDateISO(date);
          const inPeriod = date >= start && date <= end;
          const row = dayMap[iso];
          const statusKey = row?.status;
          return (
            <div
              key={iso}
              className={[
                'day-cell',
                inPeriod ? '' : 'outside',
                statusKey ? STATUS_CLASS[statusKey] : '',
              ].join(' ')}
            >
              <div className="day-number">{date.getDate()}</div>
              {statusKey && <div className="day-status">{STATUS_LABEL[statusKey]}</div>}
            </div>
          );
        })}
      </div>

      <p className="note">
        ※現在は閲覧のみです。データがまだ登録されていないため、すべて空欄で表示されます。
      </p>
    </main>
  );
}
