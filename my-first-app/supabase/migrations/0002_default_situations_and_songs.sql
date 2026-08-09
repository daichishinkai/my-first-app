-- カラオケ選曲メモ: 新規ユーザーへの初期シチュエーション・初期曲の自動セットアップ
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。

create or replace function create_default_situations_and_songs()
returns trigger as $$
begin
  with situations_inserted as (
    insert into situations (user_id, name)
    values
      (new.id, 'お気に入り'),
      (new.id, 'ヒトカラ'),
      (new.id, '盛り上がる曲'),
      (new.id, 'しっとりする曲'),
      (new.id, 'おじさん接待用'),
      (new.id, '高得点狙い'),
      (new.id, '練習中')
    returning id, name
  ),
  songs_inserted as (
    insert into songs (user_id, title, artist, key_offset, needs_check, satisfaction)
    values
      (new.id, '与作', '北島三郎', 0, false, 3),
      (new.id, 'YOUNG MAN（Y.M.C.A.）', '西城秀樹', 0, false, 3),
      (new.id, '関白宣言', 'さだまさし', 0, false, 3)
    returning id
  )
  insert into song_situations (song_id, situation_id)
  select songs_inserted.id, situations_inserted.id
  from songs_inserted, situations_inserted
  where situations_inserted.name = 'おじさん接待用';

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created_defaults on auth.users;
create trigger on_auth_user_created_defaults
  after insert on auth.users
  for each row
  execute function create_default_situations_and_songs();

-- 既存ユーザーへのバックフィル（まだシチュエーションを持っていないユーザーのみ対象）
do $$
declare
  target_user record;
  entertain_situation_id uuid;
begin
  for target_user in
    select u.id
    from auth.users u
    left join situations s on s.user_id = u.id
    where s.id is null
  loop
    with situations_inserted as (
      insert into situations (user_id, name)
      values
        (target_user.id, 'お気に入り'),
        (target_user.id, 'ヒトカラ'),
        (target_user.id, '盛り上がる曲'),
        (target_user.id, 'しっとりする曲'),
        (target_user.id, 'おじさん接待用'),
        (target_user.id, '高得点狙い'),
        (target_user.id, '練習中')
      returning id, name
    ),
    songs_inserted as (
      insert into songs (user_id, title, artist, key_offset, needs_check, satisfaction)
      values
        (target_user.id, '与作', '北島三郎', 0, false, 3),
        (target_user.id, 'YOUNG MAN（Y.M.C.A.）', '西城秀樹', 0, false, 3),
        (target_user.id, '関白宣言', 'さだまさし', 0, false, 3)
      returning id
    )
    insert into song_situations (song_id, situation_id)
    select songs_inserted.id, situations_inserted.id
    from songs_inserted, situations_inserted
    where situations_inserted.name = 'おじさん接待用';
  end loop;
end $$;
