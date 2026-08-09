-- カラオケ選曲メモ: フレンド機能（申請・承認）と共通曲の判定
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。

create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  unique (from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

create index if not exists friend_requests_from_user_id_idx on friend_requests(from_user_id);
create index if not exists friend_requests_to_user_id_idx on friend_requests(to_user_id);

alter table friend_requests enable row level security;

create policy "friend_requests_select_own" on friend_requests
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "friend_requests_insert_own" on friend_requests
  for insert with check (auth.uid() = from_user_id);

create policy "friend_requests_update_recipient" on friend_requests
  for update using (auth.uid() = to_user_id);

create policy "friend_requests_delete_own" on friend_requests
  for delete using (auth.uid() = from_user_id or auth.uid() = to_user_id);

-- 確定した友だち関係にある場合のみ、曲名・歌手名が一致する曲を返す
-- （相手のキーや満足度などの個人的な評価は返さない）
create or replace function get_common_songs(friend_id uuid)
returns table (title text, artist text) as $$
begin
  if not exists (
    select 1 from friend_requests
    where status = 'accepted'
      and (
        (from_user_id = auth.uid() and to_user_id = friend_id)
        or (to_user_id = auth.uid() and from_user_id = friend_id)
      )
  ) then
    return;
  end if;

  return query
    select distinct a.title, a.artist
    from songs a
    join songs b
      on lower(trim(a.title)) = lower(trim(b.title))
      and lower(trim(a.artist)) = lower(trim(b.artist))
    where a.user_id = auth.uid()
      and b.user_id = friend_id;
end;
$$ language plpgsql security definer set search_path = public;
