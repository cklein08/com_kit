"use client";

import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";

/**
 * Wraps children with a pencil edit button when ?vse= or ?cse= is in the URL.
 * The pencil links to the provided href (e.g. Amplience visualization URL or AEM editor URL).
 *
 * @param {{ href: string, label: string, children: React.ReactNode }} props
 */
export function EditPencilWrapper({ href, label, children }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const showPencil = !!vse && !!href;

  if (!showPencil) {
    return <>{children}</>;
  }

  return (
    <div className="relative" data-amplience-edit-wrapper>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={`Edit ${label}`}
        className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
        aria-label={`Edit ${label}`}
      >
        <Pencil className="h-4 w-4" />
      </a>
      {children}
    </div>
  );
}
