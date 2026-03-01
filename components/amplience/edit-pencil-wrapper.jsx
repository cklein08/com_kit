"use client";

import { useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";

/**
 * Wraps children with a pencil edit button when ?vse= or ?cse= is in the URL.
 * The pencil links to the provided href (e.g. Amplience visualization URL or AEM editor URL).
 * Pencil is positioned top-right by default; use pencilPosition="bottom-right" for alternate placement.
 *
 * @param {{ href: string, label: string, children: React.ReactNode, className?: string, pencilPosition?: 'top-right' | 'bottom-right' }} props
 */
export function EditPencilWrapper({ href, label, children, className = "", pencilPosition = "top-right" }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const showPencil = !!vse && !!href;

  if (!showPencil) {
    return <>{children}</>;
  }

  const positionClass = pencilPosition === "bottom-right" ? "bottom-2 right-2" : "top-2 right-2";

  return (
    <div className={`relative ${className}`.trim()} data-amplience-edit-wrapper>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={`Edit ${label}`}
        className={`absolute ${positionClass} z-20 flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900`}
        aria-label={`Edit ${label}`}
      >
        <Pencil className="h-4 w-4" />
      </a>
      {children}
    </div>
  );
}
