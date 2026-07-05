'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivateEventsManager({ items }) {
  const [date, setDate] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function add(e) {
    e.preventDefault();
    if (!date || !title) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/private-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, title }),
      });
      if (!res.ok) throw new Error('追加に失敗しました');
      setDate('');
      setTitle('');
      router.refresh();
    } catch (e2) {
      setError(e2.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/private-events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
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
      <h2>プライベートの用事</h2>
      <p className="manage-hint">用事がある日は休日になります（他のルールと重なる場合は「要確認」になることがあります）。</p>

      <form className="manage-form manage-form-private" onSubmit={add}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="内容（例：通院）"
          required
        />
        <button type="submit" disabled={busy}>
          追加
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <ul className="manage-list">
        {items.length === 0 && <li className="manage-empty">登録はありません</li>}
        {items.map((item) => (
          <li key={item.id}>
            <span>
              {item.date}（{item.title}）
            </span>
            <button type="button" disabled={busy} onClick={() => remove(item.id)}>
              削除
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
