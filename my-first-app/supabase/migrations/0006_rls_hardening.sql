-- カラオケ選曲メモ: RLSポリシーの明確化・強化
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。

drop policy if exists "songs_update_own" on songs;
create policy "songs_update_own" on songs
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "situations_update_own" on situations;
create policy "situations_update_own" on situations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "friend_requests_update_recipient" on friend_requests;
create policy "friend_requests_update_recipient" on friend_requests
  for update
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id and status = 'accepted');
