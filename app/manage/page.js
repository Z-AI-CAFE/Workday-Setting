import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/supabaseServer';
import ColleagueHolidaysManager from '../../components/ColleagueHolidaysManager';
import SalaryDaysManager from '../../components/SalaryDaysManager';
import PrivateEventsManager from '../../components/PrivateEventsManager';
import RefreshButton from '../../components/RefreshButton';

export const dynamic = 'force-dynamic';

export default async function ManagePage() {
  const supabase = getSupabaseServerClient();

  const [holidaysRes, salaryRes, eventsRes] = await Promise.all([
    supabase.from('colleague_holidays').select('date').order('date', { ascending: true }),
    supabase.from('salary_days').select('date, type').order('date', { ascending: true }),
    supabase.from('private_events').select('id, date, title').order('date', { ascending: true }),
  ]);

  const loadError = holidaysRes.error || salaryRes.error || eventsRes.error;

  return (
    <main className="calendar-page">
      <h1>入力・設定</h1>

      <p className="manage-back">
        <Link href="/">← カレンダーに戻る</Link>
      </p>

      <RefreshButton />

      {loadError && (
        <p className="error">データの取得に失敗しました：{loadError.message}</p>
      )}

      <ColleagueHolidaysManager items={holidaysRes.data || []} />
      <SalaryDaysManager items={salaryRes.data || []} />
      <PrivateEventsManager items={eventsRes.data || []} />
    </main>
  );
}
