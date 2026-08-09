"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyShareLinkButton({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/share/${userId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-fit gap-1.5 text-muted-foreground"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="size-3.5" />
      ) : (
        <Share2 className="size-3.5" />
      )}
      {copied ? "コピーしました" : "公開用URLをコピー"}
    </Button>
  );
}
