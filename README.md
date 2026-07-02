# schedule-app

個人用スケジュール管理アプリ（16日始まりの期間で出勤予定を自動決定・手動編集）

## セットアップ

1. `.env.local.example` を `.env.local` にコピーし、Supabaseの値とログイン用パスワードを設定する
2. `npm install`
3. `npm run dev` でローカル確認（http://localhost:3000）

`.env.local` はGitに含めません（個人情報・鍵情報が入るため）。
