"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { MainNav } from "@/components/main-nav";
import { AuthBar } from "@/components/auth-bar";
import { Footer } from "@/components/footer";
import { mapJsonRichText } from "@/lib/renderRichText";
import { UE_CORS_SCRIPT_URL, DEFAULT_AEM_EDITOR_URL, DEFAULT_AEM_PROJECT } from "@/lib/constants";

export default function BlogPostPage({ params }) {
  const resolvedParams = use(params);
  const slug = resolvedParams?.slug;
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    fetch(`/api/aem/blog?slug=${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        return res.ok ? res.json() : null;
      })
      .then((data) => {
        setBlog(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
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
          <main className="flex-1 flex items-center justify-center p-8">
            <p className="text-muted-foreground">Loading…</p>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (notFound || !blog) {
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
          <main className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <h1 className="text-2xl font-semibold">Blog post not found</h1>
            <Link href="/" className="text-primary hover:underline">Back to home</Link>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const { title, image, author, body, _path } = blog;
  const imageAsset = image ?? {};
  const imageSrc =
    imageAsset._dynamicUrl || imageAsset._authorUrl
      ? `${(config?.env || "").replace(/\/$/, "")}${imageAsset._dynamicUrl || imageAsset._authorUrl}`
      : null;

  const editorProps = {
    "data-aue-resource": _path ? `urn:aemconnection:${_path}/jcr:content/data/master` : undefined,
    "data-aue-type": "container",
    "data-aue-label": "Blog post",
  };

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
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8" {...editorProps}>
          <article className="blog-post">
            <h1 className="text-3xl font-bold mb-2" data-aue-prop="title">{title}</h1>
            {author && (
              <p className="text-muted-foreground text-sm mb-4" data-aue-prop="author">{author}</p>
            )}
            {imageSrc && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-6">
                <Image
                  src={imageSrc}
                  alt={title || ""}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {body?.json && (
              <div className="blog-post-body prose prose-zinc max-w-none" data-aue-prop="body">
                {mapJsonRichText(
                  Array.isArray(body.json) ? body.json : body.json?.content ?? []
                )}
              </div>
            )}
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}
