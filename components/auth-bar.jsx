"use client";

import { useState, useEffect } from "react";
import { User } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { AdobeSignInButton } from "@/components/adobe-sign-in-button";
import { isCookieAuth } from "@/lib/auth/cookie-auth";
import { getProfilePictureUrl } from "@/lib/auth/profile-image";

/**
 * Use AdobeSignInButton (IMS implicit) when not on cookie auth.
 * Matches awesomeportal: always show the button; it surfaces inline error when not configured.
 */
function useImsImplicit() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted && !isCookieAuth();
}

export function AuthBar() {
  const { user, loading, authenticated, signIn, signOut, handleImsAuthenticated } = useAuth();
  const useIms = useImsImplicit();

  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [user?.email]);
  if (useIms) {
    const pictureUrl = getProfilePictureUrl(user);
    const showAvatar = pictureUrl && !imgError;
    return (
      <div className="flex items-center gap-2">
        {authenticated && (
          <>
            {showAvatar ? (
              <img
                src={pictureUrl}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
                width={32}
                height={32}
                onError={() => setImgError(true)}
              />
            ) : (
              <div
                className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
                aria-hidden
              >
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {(user?.name || user?.email) && (
              <span className="text-sm truncate max-w-[120px]" title={user?.email}>
                {user?.name || user?.email}
              </span>
            )}
          </>
        )}
        <AdobeSignInButton
          onAuthenticated={handleImsAuthenticated}
          onSignOut={signOut}
          authenticated={authenticated}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <span className="hover:underline opacity-70">
        Sign In
      </span>
    );
  }

  if (authenticated) {
    const pictureUrl = getProfilePictureUrl(user);
    const showAvatar = pictureUrl && !imgError;
    return (
      <div className="flex items-center gap-2">
        {showAvatar ? (
          <img
            src={pictureUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
            width={32}
            height={32}
            onError={() => setImgError(true)}
          />
        ) : (
          <div
            className="h-8 w-8 rounded-full bg-muted flex items-center justify-center"
            aria-hidden
          >
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
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
