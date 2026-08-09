import Link from "next/link";
import { Mic2 } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="sticky top-0 z-10 w-full border-b bg-background">
        <div className="max-w-md mx-auto w-full flex items-center justify-between px-4 h-14">
          <Link href="/protected" className="flex items-center gap-2 font-bold text-base">
            <Mic2 className="size-5 text-primary" />
            カラオケ選曲メモ
          </Link>
          <LogoutButton />
        </div>
      </nav>
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-8 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
        {children}
      </main>
    </div>
  );
}
