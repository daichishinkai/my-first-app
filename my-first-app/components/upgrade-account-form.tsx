"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export function UpgradeAccountForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser(
      { email, password },
      { emailRedirectTo: `${window.location.origin}/friends` },
    );

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setDone(true);
    setIsLoading(false);
    router.refresh();
  };

  if (done) {
    return (
      <p className="text-sm text-muted-foreground">
        登録を受け付けました。確認メールが届いた場合は、メール内のリンクをタップすると友だち機能が使えるようになります。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid gap-2">
        <Label htmlFor="upgrade-email">メールアドレス</Label>
        <Input
          id="upgrade-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="upgrade-password">パスワード</Label>
        <Input
          id="upgrade-password"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="size-4 animate-spin" />}
        {isLoading ? "登録中..." : "登録する"}
      </Button>
    </form>
  );
}
