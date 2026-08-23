import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[600px] px-4 py-24 text-center">
      <p className="font-mono text-sm font-semibold uppercase tracking-wider text-saffron-deep">
        404 Not Found
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">
        Page does not exist
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        The requested government roadmap or page could not be located.
      </p>
      <div className="mt-6 flex items-center justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-saffron-deep"
        >
          <ArrowLeft size={15} /> Return Home
        </Link>
      </div>
    </div>
  );
}
