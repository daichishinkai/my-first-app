# RLS（Row Level Security）ポリシー要件

カラオケ選曲メモのSupabaseデータベースにおけるRLSポリシーの要件・現状をまとめたもの。CLAUDE.mdの要件（「ユーザーごとに独立した曲リストを持つ（他人のリストは基本見えない）」「曲リストは基本非公開、公開したい曲だけを見せられるようにする」）を、データベース層でどう担保しているかを記録する。

対応するSQLの実体は `supabase/migrations/` 配下（0001, 0003, 0005, 0006, 0009）。

## 基本方針

- 全テーブルでRLSを有効化し、「自分のデータのみ操作可能」をデフォルトとする
- 例外的に他人のデータを見せる場合（公開リスト・フレンド共通曲）は、要件で明示的に許可された範囲・条件でのみ許可する
- UPDATE系ポリシーは `USING` だけでなく `WITH CHECK` も明示し、更新後の行が引き続き条件を満たすことを保証する
- 他人のデータに依存する判定ロジック（共通曲の算出など）は、生データを直接RLSで晒すのではなく `SECURITY DEFINER` 関数を介し、必要な情報（曲名・歌手名のみ）だけを返す

## songs（曲）

| ポリシー | 操作 | 条件 |
|---|---|---|
| songs_select_own | SELECT | `auth.uid() = user_id` |
| songs_insert_own | INSERT | `auth.uid() = user_id` |
| songs_update_own | UPDATE | USING/CHECK 共に `auth.uid() = user_id` |
| songs_delete_own | DELETE | `auth.uid() = user_id` |
| songs_select_public | SELECT | `is_public = true AND auth.role() = 'authenticated'`（ログイン済みユーザーのみ、公開フラグの曲を閲覧可） |

満足度・キー・要確認フラグなど個人的な評価データは、公開フラグを立てない限り本人以外には一切見えない。`original_lowest_note`/`original_highest_note`（原曲の音域、任意項目）も同様に本人のみ。

## user_vocal_ranges（ユーザーの声域）

| ポリシー | 操作 | 条件 |
|---|---|---|
| user_vocal_ranges_select_own | SELECT | `auth.uid() = user_id` |
| user_vocal_ranges_insert_own | INSERT | `auth.uid() = user_id` |
| user_vocal_ranges_update_own | UPDATE | USING/CHECK 共に `auth.uid() = user_id` |
| user_vocal_ranges_delete_own | DELETE | `auth.uid() = user_id` |

声域は完全に個人情報のため、公開・共有の対象外。常に本人のみアクセス可能（`user_id`を主キーとし1ユーザー1行）。

## situations（シチュエーション）

| ポリシー | 操作 | 条件 |
|---|---|---|
| situations_select_own | SELECT | `auth.uid() = user_id` |
| situations_insert_own | INSERT | `auth.uid() = user_id` |
| situations_update_own | UPDATE | USING/CHECK 共に `auth.uid() = user_id` |
| situations_delete_own | DELETE | `auth.uid() = user_id` |

シチュエーションは公開・共有の対象外。常に本人のみアクセス可能。

## song_situations（曲とシチュエーションの中間テーブル）

| ポリシー | 操作 | 条件 |
|---|---|---|
| song_situations_select_own | SELECT | 紐づく`songs`が自分の所有物であること |
| song_situations_insert_own | INSERT | 紐づく`songs`・`situations`の両方が自分の所有物であること |
| song_situations_delete_own | DELETE | 紐づく`songs`が自分の所有物であること |

他人の曲に自分のシチュエーションを紐付けたり、他人のシチュエーションを自分の曲に紐付けたりできないよう、両側の所有権を確認する。UPDATEは行わない実装のためポリシーなし（RLSはデフォルト拒否のため安全）。

## friend_requests（フレンド申請・関係）

| ポリシー | 操作 | 条件 |
|---|---|---|
| friend_requests_select_own | SELECT | `auth.uid() = from_user_id OR auth.uid() = to_user_id` |
| friend_requests_insert_own | INSERT | `auth.uid() = from_user_id`（他人になりすまして申請不可） |
| friend_requests_update_recipient | UPDATE | USING: `auth.uid() = to_user_id` / CHECK: `auth.uid() = to_user_id AND status = 'accepted'`（受信者が承認する操作のみに限定し、申請者の書き換え等を防ぐ） |
| friend_requests_delete_own | DELETE | `auth.uid() = from_user_id OR auth.uid() = to_user_id`（申請の取消・拒否・友だち解除に使用） |

テーブル制約 `check (from_user_id <> to_user_id)` により自分自身への申請も不可。

## get_common_songs（フレンド共通曲取得関数）

- `SECURITY DEFINER` かつ `search_path = public` 固定（search_path経由の権限昇格を防止）
- 呼び出し時、`auth.uid()`と引数の`friend_id`が`friend_requests`上で`status = 'accepted'`の関係にあることを確認してから処理を続行
- 返す情報は一致した曲の「曲名・歌手名」のみ。相手のキー・満足度・要確認フラグなど、共通曲判定に不要な個人データは一切返さない

## 新規ユーザー向け初期データ投入トリガー

- `create_default_situations_and_songs`（`auth.users`へのINSERT時に発火）も`SECURITY DEFINER`かつ`search_path = public`固定
- RLSをバイパスして新規ユーザー自身のuser_idに紐づく初期データのみを作成する（他ユーザーのデータには一切触れない）
