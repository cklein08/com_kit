"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { MainNav } from "@/components/main-nav";
import { AuthBar } from "@/components/auth-bar";
import { Footer } from "@/components/footer";
import { UE_CORS_SCRIPT_URL, DEFAULT_AEM_EDITOR_URL, DEFAULT_AEM_PROJECT } from "@/lib/constants";

function sortBlogsNewToOld(items) {
  if (!Array.isArray(items) || items.length === 0) return items;
  return [...items].sort((a, b) => {
    const dateA = a.date || a._metadata?.lastModified || "";
    const dateB = b.date || b._metadata?.lastModified || "";
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateB.localeCompare(dateA);
  });
}

export default function BlogListPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedAemEnv = localStorage.getItem("aemEnvironment");
      const storedProjectName = localStorage.getItem("projectName");
      const isInUniversalEditor = window.self !== window.top;
      const aemEnv = storedAemEnv || (isInUniversalEditor ? DEFAULT_AEM_EDITOR_URL : "");
      const aemProject = storedProjectName || (isInUniversalEditor ? DEFAULT_AEM_PROJECT : "");
      setConfig({ env: aemEnv, project: aemProject });
    }
  }, []);

  useEffect(() => {
    fetch("/api/aem/blog?list=true&limit=50")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const items = Array.isArray(data) ? data : [];
        setBlogs(sortBlogsNewToOld(items));
        setLoading(false);
      })
      .catch(() => {
        setBlogs([]);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Script src={UE_CORS_SCRIPT_URL} async />
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <div className="utility-bar">
          <Link href="/" className="hover:underline">Find a Store</Link>
          <Link href="/" className="hover:underline">Help</Link>
          <Link href="/" className="hover:underline">Join Us</Link>
          <AuthBar />
        </div>
        {config?.env && <MainNav config={config} />}
        <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
          <h1 className="text-3xl font-bold mb-8">Blog</h1>
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : blogs.length === 0 ? (
            <p className="text-muted-foreground">No blog posts yet.</p>
          ) : (
            <ul className="space-y-8 list-none p-0 m-0">
              {blogs.map((blog) => {
                const imageAsset = blog.image ?? {};
                const imageSrc =
                  imageAsset._dynamicUrl || imageAsset._authorUrl
                    ? `${(config?.env || "").replace(/\/$/, "")}${imageAsset._dynamicUrl || imageAsset._authorUrl}`
                    : null;
                const href = blog.urlSlug ? `/blog/${blog.urlSlug}` : "#";
                return (
                  <li key={blog._path || blog.urlSlug || blog.title}>
                    <Link href={href} className="block group">
                      <article className="border-b border-zinc-200 pb-8 last:border-0">
                        <div className="flex gap-6 flex-col sm:flex-row">
                          {imageSrc && (
                            <div className="relative w-full sm:w-48 h-32 sm:h-28 flex-shrink-0 rounded-lg overflow-hidden bg-zinc-100">
                              <Image
                                src={imageSrc}
                                alt={blog.title || ""}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                              {blog.title}
                            </h2>
                            {blog.author && (
                              <p className="text-sm text-muted-foreground mt-1">{blog.author}</p>
                            )}
                            {blog.excerpt && (
                              <p className="text-muted-foreground mt-2 line-clamp-2">
                                {blog.excerpt}
                              </p>
                            )}
                            <span className="inline-block mt-2 text-sm font-medium text-primary group-hover:underline">
                              Read more →
                            </span>
                          </div>
                        </div>
                      </article>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
