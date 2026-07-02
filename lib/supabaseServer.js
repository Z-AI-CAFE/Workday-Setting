import { createClient } from '@supabase/supabase-js';

// このファイルはサーバー側だけで動きます（ブラウザのJavaScriptには含まれません）。
// そのため、鍵の名前は「NEXT_PUBLIC_」を付けず、外部に漏れないようにしています。
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  return createClient(url, key);
}
