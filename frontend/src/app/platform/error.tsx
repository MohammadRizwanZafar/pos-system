"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h2 className="text-xl font-bold text-slate-900">Platform page error</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Something went wrong loading shops. Try again or log in as platform admin.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/login" className="btn-secondary">
          Back to login
        </Link>
      </div>
    </div>
  );
}
