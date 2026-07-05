'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const TYPE_OPTIONS = [
  { value: 'monk_prep', label: '僧侶給料準備日' },
  { value: 'monk_pay', label: '僧侶給料支払日' },
  { value: 'staff_prep', label: '職員給料準備日' },
  { value: 'staff_pay', label: '職員給料支払日' },
];

const TYPE_LABEL = Object.fromEntries(TYPE_OPTIONS.map((o) => [o.value, o.label]));

export default function SalaryDaysManager({ items }) {
  const [date, setDate] = useState('');
  const [type, setType] = useState(TYPE_OPTIONS[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function add(e) {
    e.preventDefault();
    if (!date) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/salary-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, type }),
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

  async function remove(d, t) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/salary-days', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: d, type: t }),
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
      <h2>給料関連日</h2>
      <p className="manage-hint">
        同僚の休日と重ならなければ半日出勤になります（重なる場合は全日出勤のままです）。
      </p>

      <form className="manage-form manage-form-salary" onSubmit={add}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <button type="submit" disabled={busy}>
          追加
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="manage-list">
        {items.length === 0 && <li className="manage-empty">登録はありません</li>}
        {items.map((item) => (
          <li key={`${item.date}-${item.type}`}>
            <span>
              {item.date}（{TYPE_LABEL[item.type] || item.type}）
            </span>
            <button type="button" disabled={busy} onClick={() => remove(item.date, item.type)}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
