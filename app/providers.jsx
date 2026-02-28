"use client";

import { Toaster } from "sonner";
import { CartProvider } from "@/contexts/cart-context";
import { AuthProvider } from "@/contexts/auth-context";
import { WishlistProvider } from "@/contexts/wishlist-context";
import { LoginRequiredProvider } from "@/contexts/login-required-context";

export function Providers({ children }) {
  return (
    <AuthProvider>
      <WishlistProvider>
        <LoginRequiredProvider>
          <CartProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </CartProvider>
        </LoginRequiredProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
