'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ColleagueHolidaysManager({ items }) {
  const [date, setDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function add(e) {
    e.preventDefault();
    if (!date) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/colleague-holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
      });
      if (!res.ok) throw new Error('追加に失敗しました');
      setDate('');
      router.refresh();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(d) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/colleague-holidays', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: d }),
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      router.refresh();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="manage-section">
      <h2>同僚の休日</h2>
      <p className="manage-hint">同僚が休みの日は、自動計算であなたが全日出勤になります。</p>

      <form className="manage-form" onSubmit={add}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <button type="submit" disabled={busy}>
          追加
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="manage-list">
        {items.length === 0 && <li className="manage-empty">登録はありません</li>}
        {items.map((item) => (
          <li key={item.date}>
            <span>{item.date}</span>
            <button type="button" disabled={busy} onClick={() => remove(item.date)}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
