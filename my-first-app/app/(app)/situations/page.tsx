import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createSituation,
  deleteSituation,
  getSituations,
  updateSituation,
} from "@/app/(app)/situations/actions";

export default function SituationsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">シチュエーション管理</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <SituationsContent />
      </Suspense>
    </>
  );
}

async function SituationsContent() {
  const situations = await getSituations();

  return (
    <>
      <form action={createSituation} className="flex gap-2">
        <Input
          type="text"
          name="name"
          placeholder="新しいシチュエーション名"
          required
          autoComplete="off"
        />
        <Button type="submit">追加</Button>
      </form>

      <div className="flex flex-col divide-y rounded-lg border shadow-sm">
        {situations.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            まだシチュエーションがありません
          </p>
        )}
        {situations.map((situation) => {
          const updateSituationWithId = updateSituation.bind(null, situation.id);
          const deleteSituationWithId = deleteSituation.bind(null, situation.id);

          return (
            <div key={situation.id} className="flex items-center gap-2 p-4">
              <form action={updateSituationWithId} className="flex-1 flex gap-2">
                <Input
                  type="text"
                  name="name"
                  defaultValue={situation.name}
                  required
                  autoComplete="off"
                />
                <Button type="submit" variant="outline" size="sm">
                  保存
                </Button>
              </form>
              <form action={deleteSituationWithId}>
                <Button type="submit" variant="destructive" size="sm">
                  削除
                </Button>
              </form>
            </div>
          );
        })}
      </div>
    </>
  );
}
