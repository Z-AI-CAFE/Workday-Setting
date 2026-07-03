'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginForm() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (res.ok) {
      const next = searchParams.get('next') || '/';
      router.push(next);
      router.refresh();
    } else {
      setError('パスワードが違います');
    }
  }

  return (
    <main className="login-page">
      <h1>ログイン</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード"
          autoFocus
        />
        <button type="submit" disabled={loading}>
          {loading ? '確認中...' : 'ログイン'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </main>
  );
}
