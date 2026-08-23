"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowLeft, ArrowClockwise, WarningCircle } from "@phosphor-icons/react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-alert-soft text-alert">
        <WarningCircle size={32} weight="duotone" />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        An error occurred while loading this section. You can try refreshing or returning home.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-saffron-deep active:scale-[0.98]"
        >
          <ArrowClockwise size={15} /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-ink hover:text-ink"
        >
          <ArrowLeft size={15} /> Back to Home
        </Link>
      </div>
    </div>
  );
}
