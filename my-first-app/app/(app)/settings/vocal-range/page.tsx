import { Suspense } from "react";
import { getVocalRange, saveVocalRange } from "@/app/(app)/settings/actions";
import { VocalRangeForm } from "@/components/settings/vocal-range-form";

export default function VocalRangeSettingsPage() {
  return (
    <>
      <h1 className="text-2xl font-bold">声域設定</h1>
      <p className="text-sm text-muted-foreground">
        無理なく歌える最低音・最高音を登録すると、曲登録・編集画面でおすすめのキーが表示されるようになります。
      </p>
      <Suspense fallback={<p className="text-sm text-muted-foreground">読み込み中...</p>}>
        <VocalRangeFormContent />
      </Suspense>
    </>
  );
}

async function VocalRangeFormContent() {
  const vocalRange = await getVocalRange();

  return <VocalRangeForm action={saveVocalRange} initialValues={vocalRange} />;
}
