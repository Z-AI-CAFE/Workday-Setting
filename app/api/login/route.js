import { NextResponse } from 'next/server';
import { hashPassword } from '../../../lib/auth';

export async function POST(request) {
  const { password } = await request.json();
  const expected = process.env.APP_PASSWORD || '';

  if (!expected || password !== expected) {
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 });
  }

  const token = await hashPassword(expected);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('auth_token', token, {
    httpOnly: true, // ブラウザのJavaScriptから読めないようにする
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 180, // 180日間ログイン状態を保持
    path: '/',
  });
  return res;
}
