"use client";

import { Suspense } from "react";
import { Toaster } from "sonner";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { LoginRequiredProvider } from "@/contexts/login-required-context";
import { AuthErrorListener } from "@/components/auth-error-listener";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <LoginRequiredProvider>
          <CartProvider>
            <Suspense fallback={null}>
              <AuthErrorListener />
            </Suspense>
            {children}
            <Toaster position="bottom-right" richColors />
          </CartProvider>
        </LoginRequiredProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
