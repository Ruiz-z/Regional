import Link from "next/link";

import { Button } from "@/shared/components/ui/button";

export function Topbar({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <header className="flex flex-none items-center justify-between gap-4 border-b border-border px-8 py-5">
      <div className="min-w-0">{children}</div>
      <div className="flex flex-none items-center gap-3">
        <Link
          href="/notifications"
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 flex-none items-center justify-center rounded-md border-[1.5px] border-border-strong text-ink no-underline transition-colors hover:bg-surface-sunken"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path
              d="M3 12V7a5 5 0 0 1 10 0v5l1.2 1.6H1.8Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
            <path
              d="M6.3 14a1.8 1.8 0 0 0 3.4 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
          <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-status-danger" />
        </Link>
        <Button asChild variant="secondary" className="no-underline">
          <Link href="/reports">Ver histórico</Link>
        </Button>
      </div>
    </header>
  );
}