// パスワードを「そのまま」比較・保存せず、変換（ハッシュ化）した値だけを
// Cookie（ブラウザに保存する小さなデータ）に入れるための関数です。
// こうすることで、Cookieの中身を見られてもパスワードそのものは分かりません。
export async function hashPassword(password) {
  const enc = new TextEncoder().encode(password || '');
  const hashBuffer = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
