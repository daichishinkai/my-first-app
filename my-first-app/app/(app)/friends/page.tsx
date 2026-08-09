import { Suspense } from "react";
import Link from "next/link";
import { Music2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  acceptFriendRequest,
  getDisplayName,
  getFriends,
  getIncomingRequests,
  removeFriendRequest,
  sendFriendRequest,
} from "@/app/(app)/friends/actions";

export default function FriendsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">友だち</h1>

      <div className="flex flex-col gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <UserPlus className="size-4" />
          友だちを追加
        </h2>
        <form action={sendFriendRequest} className="flex gap-2">
          <Input
            type="text"
            name="user_id"
            placeholder="相手のユーザーID（公開リストURLの末尾）"
            required
            autoComplete="off"
          />
          <Button type="submit">申請</Button>
        </form>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <IncomingRequests />
      </Suspense>

      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <FriendList />
      </Suspense>
    </>
  );
}

async function IncomingRequests() {
  const requests = await getIncomingRequests();

  if (requests.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-muted-foreground">届いている申請</h2>
      <div className="flex flex-col divide-y rounded-lg border shadow-sm">
        {requests.map(async (request) => {
          const acceptWithId = acceptFriendRequest.bind(null, request.id);
          const rejectWithId = removeFriendRequest.bind(null, request.id);
          const displayName = await getDisplayName(request.from_user_id);
          return (
            <div key={request.id} className="flex items-center justify-between gap-2 p-4">
              <span className="text-sm truncate">{displayName}</span>
              <div className="flex gap-2 shrink-0">
                <form action={acceptWithId}>
                  <Button type="submit" size="sm">
                    承認
                  </Button>
                </form>
                <form action={rejectWithId}>
                  <Button type="submit" size="sm" variant="outline">
                    拒否
                  </Button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

async function FriendList() {
  const friends = await getFriends();

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-bold text-muted-foreground">友だち一覧</h2>
      <div className="flex flex-col divide-y rounded-lg border shadow-sm">
        {friends.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            まだ友だちがいません
          </p>
        )}
        {friends.map(async (friend) => {
          const removeWithId = removeFriendRequest.bind(null, friend.requestId);
          const displayName = await getDisplayName(friend.friendUserId);
          return (
            <div
              key={friend.requestId}
              className="flex items-center justify-between gap-2 p-4"
            >
              <div className="flex flex-col gap-0.5 truncate">
                <span className="text-sm font-medium truncate">{displayName}</span>
                <Link
                  href={`/friends/${friend.friendUserId}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:underline"
                >
                  <Music2 className="size-3.5 text-primary" />
                  共通曲を見る
                </Link>
              </div>
              <form action={removeWithId}>
                <Button type="submit" size="sm" variant="destructive">
                  削除
                </Button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
