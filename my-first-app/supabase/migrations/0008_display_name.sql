-- カラオケ選曲メモ: フレンド関係のある相手の表示名を取得する関数
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。

create or replace function get_display_name(target_user_id uuid)
returns text as $$
declare
  result text;
begin
  if target_user_id <> auth.uid() and not exists (
    select 1 from friend_requests
    where (from_user_id = auth.uid() and to_user_id = target_user_id)
       or (to_user_id = auth.uid() and from_user_id = target_user_id)
  ) then
    return null;
  end if;

  select coalesce(raw_user_meta_data->>'display_name', split_part(email, '@', 1))
  into result
  from auth.users
  where id = target_user_id;

  return result;
end;
$$ language plpgsql security definer set search_path = public;
