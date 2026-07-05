import { createClient } from '@supabase/supabase-js';

// このファイルはサーバー側だけで動きます（ブラウザのJavaScriptには含まれません）。
// そのため、鍵の名前は「NEXT_PUBLIC_」を付けず、外部に漏れないようにしています。
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return createClient(url, key, {
    global: {
      // Supabaseへの通信1つ1つに「キャッシュを使わない」を明示し、
      // 古いデータが使い回されるのを確実に防ぐ
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
  });
}
