"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const LoginRequiredContext = createContext(null);

const MESSAGE_FOR_FAVORITES = "You must be logged in. To save to favorites.";

export function LoginRequiredProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(MESSAGE_FOR_FAVORITES);

  const showLoginRequiredForFavorites = useCallback(() => {
    setMessage(MESSAGE_FOR_FAVORITES);
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ showLoginRequiredForFavorites }),
    [showLoginRequiredForFavorites]
  );

  return (
    <LoginRequiredContext.Provider value={value}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{message}</p>
          <DialogFooter>
            <Button type="button" onClick={() => setOpen(false)}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </LoginRequiredContext.Provider>
  );
}

export function useLoginRequired() {
  const ctx = useContext(LoginRequiredContext);
  if (!ctx) {
    throw new Error("useLoginRequired must be used within LoginRequiredProvider");
  }
  return ctx;
}
