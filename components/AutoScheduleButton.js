'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 表示中の期間に対して自動決定ロジックを実行するボタン
// refDateIso: この期間に含まれる日付を1つ渡す（期間の判定に使う）
export default function AutoScheduleButton({ refDateIso }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  async function run() {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/auto-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: refDateIso }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || '自動計算に失敗しました。');
      }
      setMessage(`完了しました（${data.updated}件を更新）`);
      router.refresh();
    } catch (e) {
      setMessage(e.message || '自動計算に失敗しました。');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auto-schedule-box">
      <button type="button" className="auto-schedule-button" onClick={run} disabled={loading}>
        {loading ? '計算中...' : 'この期間を自動計算する'}
      </button>
      {message && <p className="auto-schedule-message">{message}</p>}
    </div>
  );
}
