"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const AUTH_ERROR_MESSAGES = {
  not_configured:
    "Sign-in not configured. Add NEXT_PUBLIC_ADOBE_CLIENT_ID (implicit flow) or ADOBE_CLIENT_ID and ADOBE_CLIENT_SECRET to .env. See docs/adobe-authentication.md.",
  token_exchange_failed: "Sign-in failed. Please try again.",
};

export function AuthErrorListener() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const error = searchParams.get("auth_error");
    if (!error) return;

    const message = AUTH_ERROR_MESSAGES[error] || `Sign-in error: ${error}`;
    toast.error("Sign-in failed", { description: message });

    const url = new URL(window.location.href);
    url.searchParams.delete("auth_error");
    router.replace(url.pathname + url.search);
  }, [searchParams, router]);

  return null;
}
