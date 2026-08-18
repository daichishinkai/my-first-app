-- カラオケ選曲メモ: ユーザーの声域・曲の原曲音域
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。

create table if not exists user_vocal_ranges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lowest_note integer not null,
  highest_note integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lowest_note <= highest_note)
);

drop trigger if exists user_vocal_ranges_set_updated_at on user_vocal_ranges;
create trigger user_vocal_ranges_set_updated_at
  before update on user_vocal_ranges
  for each row
  execute function set_updated_at();

alter table user_vocal_ranges enable row level security;

create policy "user_vocal_ranges_select_own" on user_vocal_ranges
  for select using (auth.uid() = user_id);
create policy "user_vocal_ranges_insert_own" on user_vocal_ranges
  for insert with check (auth.uid() = user_id);
create policy "user_vocal_ranges_update_own" on user_vocal_ranges
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "user_vocal_ranges_delete_own" on user_vocal_ranges
  for delete using (auth.uid() = user_id);

-- 曲側: 原曲の音域（任意項目、両方入力 or 両方未入力のどちらか）
alter table songs add column if not exists original_lowest_note integer;
alter table songs add column if not exists original_highest_note integer;

alter table songs add constraint songs_original_range_check
  check (
    (original_lowest_note is null and original_highest_note is null)
    or (
      original_lowest_note is not null
      and original_highest_note is not null
      and original_lowest_note <= original_highest_note
    )
  );
