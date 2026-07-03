import { NextResponse } from 'next/server';
import { hashPassword } from './lib/auth';

// ログイン画面・ログイン処理・静的ファイル以外の、すべてのページとAPIを
// パスワードで保護するための「関所」です。
export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    // APP_PASSWORD が未設定の場合は、安全のため必ずログイン画面に止める
    // （「未設定」を鍵の代わりに使われてしまうことを防ぐため）
    return NextResponse.redirect(loginUrl);
  }

  const token = request.cookies.get('auth_token')?.value;
  const expected = await hashPassword(appPassword);

  if (token && token === expected) {
    return NextResponse.next();
  }

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
