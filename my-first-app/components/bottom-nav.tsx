"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/songs", label: "探す", icon: Search },
  { href: "/songs/new", label: "登録する", icon: PlusCircle },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 z-10 w-full border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 w-full max-w-md items-stretch">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
