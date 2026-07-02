-- ============================================================
-- スケジュール管理アプリ データベース設計図（テーブル定義）
-- ============================================================
-- 「テーブル」＝データを表形式で保存する入れ物のことです。
-- このファイルをSupabase（データベースサービス）のSQL Editorに
-- 貼り付けて実行すると、必要な表がすべて作られます。
-- ============================================================

-- ------------------------------------------------------------
-- 1. schedule_days：1日ごとの最終的なスケジュール
-- ------------------------------------------------------------
-- 自動決定ロジックが計算した結果と、あなたが手動で直した結果を
-- 1日1行で管理する、アプリの中心となる表です。
create table schedule_days (
  date date primary key,                  -- 対象の日付（例：2026-07-16）
  status text not null default 'day_off', -- 状態：full_work(全日出勤) / half_work(半日出勤) / day_off(休日) / needs_confirmation(要確認)
  reason text not null default 'auto_adjust',
    -- 理由：colleague_off(同僚休日) / salary_monk_prep(僧侶給料準備日) / salary_monk_pay(僧侶給料支払日)
    -- staff_prep(職員給料準備日) / staff_pay(職員給料支払日) / private_event(プライベート用事)
    -- auto_adjust(週4出勤調整) / manual(手動編集) / conflict_salary_private(給料日と用事が重複＝要確認)
  manual_fixed boolean not null default false,
    -- true の場合、自動計算で上書きしない「手動固定」の日
  note text,
    -- 個人的なメモ（休む理由やプライベートの内容など）。コードには含めずここだけに保存
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. colleague_holidays：同僚の休日（最優先ルール用の入力データ）
-- ------------------------------------------------------------
create table colleague_holidays (
  date date primary key,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. salary_days：給料関連の日（優先ルール用の入力データ）
-- ------------------------------------------------------------
create table salary_days (
  date date not null,
  type text not null,
    -- monk_prep(僧侶給料準備日) / monk_pay(僧侶給料支払日)
    -- staff_prep(職員給料準備日) / staff_pay(職員給料支払日)
  primary key (date, type)
);

-- ------------------------------------------------------------
-- 4. private_events：プライベートの用事（優先ルール用の入力データ）
-- ------------------------------------------------------------
create table private_events (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  title text not null,   -- 用事の内容（個人情報。コードには含めずここだけに保存）
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 検索を速くするための索引（インデックス）
-- ------------------------------------------------------------
create index idx_salary_days_date on salary_days(date);
create index idx_private_events_date on private_events(date);
