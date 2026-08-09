-- カラオケ選曲メモ: デフォルトシチュエーションに「歌えないけど好き」を追加
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
      (new.id, '練習中'),
      (new.id, '歌えないけど好き')
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

-- 既存ユーザーへのバックフィル（まだ「歌えないけど好き」を持っていないユーザーのみ対象）
insert into situations (user_id, name)
select u.id, '歌えないけど好き'
from auth.users u
where not exists (
  select 1 from situations s
  where s.user_id = u.id and s.name = '歌えないけど好き'
);
