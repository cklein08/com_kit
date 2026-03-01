"use client";

import { useAuth } from "@/contexts/auth-context";

export function AuthBar() {
  const { user, loading, authenticated, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <span className="hover:underline opacity-70">
        Sign In
      </span>
    );
  }

  if (authenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm truncate max-w-[120px]" title={user?.email}>
          {user?.name || user?.email || "Signed in"}
        </span>
        <button
          type="button"
          onClick={signOut}
          className="hover:underline text-sm"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={signIn}
      className="hover:underline"
    >
      Sign In
    </button>
  );
}
