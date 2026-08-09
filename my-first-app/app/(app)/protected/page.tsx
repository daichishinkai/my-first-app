import { Suspense } from "react";
import Link from "next/link";
import { Search, PlusCircle, Tags, Share2, Users, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSituations } from "@/app/(app)/situations/actions";
import { requireUserId } from "@/lib/supabase/auth";

export default function HomePage() {
  return (
    <>
      <div className="flex gap-3">
        <Button asChild size="lg" className="flex-1 gap-2">
          <Link href="/songs">
            <Search className="size-4" />
            探す
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="flex-1 gap-2">
          <Link href="/songs/new">
            <PlusCircle className="size-4" />
            登録する
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Tags className="size-4 text-primary" />
            シチュエーションから探す
          </h2>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2.5 text-muted-foreground"
          >
            <Link href="/situations">
              <Pencil className="size-3.5" />
              編集
            </Link>
          </Button>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
          <SituationList />
        </Suspense>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
          <Share2 className="size-4" />
          あなたの公開リストURL
        </h2>
        <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
          <ShareLink />
        </Suspense>
      </div>

      <div className="flex items-center gap-2">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-fit gap-1.5 text-muted-foreground"
        >
          <Link href="/friends">
            <Users className="size-3.5 text-primary" />
            友だち
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
        <ThemeToggle />
      </div>
    </>
  );
}

async function ShareLink() {
  const { userId } = await requireUserId();

  return (
    <Link
      href={`/share/${userId}`}
      className="text-sm text-muted-foreground hover:underline break-all"
    >
      /share/{userId}
    </Link>
  );
}

async function SituationList() {
  const situations = await getSituations();

  if (situations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        まだシチュエーションがありません
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {situations.map((situation) => (
        <Link key={situation.id} href={`/songs?situation=${situation.id}`}>
          <Badge
            variant="outline"
            className="rounded-full px-3.5 py-1.5 text-sm hover:bg-accent"
          >
            {situation.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
