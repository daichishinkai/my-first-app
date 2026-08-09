-- カラオケ選曲メモ: 曲・シチュエーション・中間テーブル
-- Supabaseダッシュボードの SQL Editor でこのファイルの内容を実行してください。

create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  artist text not null,
  key_offset integer not null default 0,
  needs_check boolean not null default false,
  satisfaction integer not null default 3 check (satisfaction between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists situations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists song_situations (
  song_id uuid not null references songs(id) on delete cascade,
  situation_id uuid not null references situations(id) on delete cascade,
  primary key (song_id, situation_id)
);

create index if not exists songs_user_id_idx on songs(user_id);
create index if not exists songs_title_idx on songs(title);
create index if not exists songs_artist_idx on songs(artist);
create index if not exists situations_user_id_idx on situations(user_id);
create index if not exists situations_name_idx on situations(name);
create index if not exists song_situations_situation_id_idx on song_situations(situation_id);

-- songs.updated_at を更新のたびに自動更新する
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists songs_set_updated_at on songs;
create trigger songs_set_updated_at
  before update on songs
  for each row
  execute function set_updated_at();

-- Row Level Security: 自分のデータのみ操作可能にする
alter table songs enable row level security;
alter table situations enable row level security;
alter table song_situations enable row level security;

create policy "songs_select_own" on songs
  for select using (auth.uid() = user_id);
create policy "songs_insert_own" on songs
  for insert with check (auth.uid() = user_id);
create policy "songs_update_own" on songs
  for update using (auth.uid() = user_id);
create policy "songs_delete_own" on songs
  for delete using (auth.uid() = user_id);

create policy "situations_select_own" on situations
  for select using (auth.uid() = user_id);
create policy "situations_insert_own" on situations
  for insert with check (auth.uid() = user_id);
create policy "situations_update_own" on situations
  for update using (auth.uid() = user_id);
create policy "situations_delete_own" on situations
  for delete using (auth.uid() = user_id);

create policy "song_situations_select_own" on song_situations
  for select using (
    exists (select 1 from songs where songs.id = song_situations.song_id and songs.user_id = auth.uid())
  );
create policy "song_situations_insert_own" on song_situations
  for insert with check (
    exists (select 1 from songs where songs.id = song_situations.song_id and songs.user_id = auth.uid())
    and exists (select 1 from situations where situations.id = song_situations.situation_id and situations.user_id = auth.uid())
  );
create policy "song_situations_delete_own" on song_situations
  for delete using (
    exists (select 1 from songs where songs.id = song_situations.song_id and songs.user_id = auth.uid())
  );
