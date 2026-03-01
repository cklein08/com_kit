"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { MainNav } from "@/components/main-nav";
import { AuthBar } from "@/components/auth-bar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";

export default function FavoritesPage() {
  const { user, loading, signIn } = useAuth();
  const { items, removeItem } = useWishlist();
  const [config, setConfig] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const env = localStorage.getItem("aemEnvironment");
      const project = localStorage.getItem("projectName");
      if (env && project) setConfig({ env, project });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="utility-bar">
        <Link href="#" className="hover:underline">
          Find a Store
        </Link>
        <Link href="#" className="hover:underline">
          Help
        </Link>
        <Link href="#" className="hover:underline">
          Join Us
        </Link>
        <AuthBar />
      </div>
      {config && <MainNav config={config} />}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Favorites</h1>
        {loading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !user ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <p className="text-muted-foreground mb-4">
              You must be logged in to view your favorites.
            </p>
            <Button onClick={signIn}>Sign In</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <Heart className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground mb-2">Your favorites list is empty.</p>
            <Link href="/" className="text-blue-600 hover:underline">
              Continue shopping
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li
                key={item.sku}
                className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4"
              >
                <Link href={`/product/${item.sku}`} className="flex flex-1 items-center gap-4 min-w-0">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <Heart className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <span className="font-medium truncate">{item.name || item.sku}</span>
                </Link>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(item.sku)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </div>
  );
}
