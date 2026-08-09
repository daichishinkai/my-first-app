-- カラオケ選曲メモ: 曲の公開フラグ・公開リスト閲覧用RLS
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。

alter table songs add column if not exists is_public boolean not null default false;

create policy "songs_select_public" on songs
  for select using (is_public = true and auth.role() = 'authenticated');
