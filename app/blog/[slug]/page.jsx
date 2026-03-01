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

/** Fallback blog matching the PDP widget when no AEM content exists */
const DEFAULT_BLOG_SLUG = "how-to-choose-the-right-fit";
const DEFAULT_BLOG_FULL = {
  title: "The Perfect Fit: A Runner's Guide to All-Day Comfort",
  excerpt: "A quick guide to sizing and comfort for all-day wear.",
  image: "https://media.istockphoto.com/id/1210120932/photo/close-up-of-athletic-woman-putting-on-sneakers.jpg?s=612x612&w=0&k=20&c=U4jBfMvYjX0Jl2qj76z2XiMznGlYB9T7dgbFT7HflDw=",
  urlSlug: DEFAULT_BLOG_SLUG,
  author: null,
  body: {
    json: [
      {
        nodeType: "paragraph",
        content: [{ nodeType: "text", value: "Finding the right shoe isn't just about the size on the box; it's about how that shoe performs at mile one versus mile ten—or even during a post-run coffee run. If your toes are tingling or your arches are aching, your gear is working against you." }],
      },
      {
        nodeType: "header",
        style: "h3",
        content: [{ nodeType: "text", value: '1. The "Rule of Thumb"' }],
      },
      {
        nodeType: "paragraph",
        content: [{ nodeType: "text", value: 'Your feet swell as you move, especially during high-impact activities. When trying on a new pair, ensure there is about half an inch (a thumb\'s width) of space between your longest toe and the front of the shoe.' }],
      },
      {
        nodeType: "paragraph",
        content: [
          { nodeType: "text", value: "Pro Tip: ", format: { variants: ["bold"] } },
          { nodeType: "text", value: "Always shop for shoes in the afternoon when your feet are at their largest." },
        ],
      },
      {
        nodeType: "header",
        style: "h3",
        content: [{ nodeType: "text", value: "2. Lock Down the Heel" }],
      },
      {
        nodeType: "paragraph",
        content: [{ nodeType: "text", value: 'A "slipping" heel is the fastest way to earn a blister. Your heel should feel snug but not pinched. If you feel vertical movement when you walk, try the "Runner\'s Loop" lacing technique to secure the ankle without over-tightening the bridge of your foot.' }],
      },
      {
        nodeType: "header",
        style: "h3",
        content: [{ nodeType: "text", value: "3. Width Over Length" }],
      },
      {
        nodeType: "paragraph",
        content: [{ nodeType: "text", value: 'Many runners size up when they actually just need a wider toe box. Your toes should be able to splay naturally. If you feel pressure on the pinky toe or the side of your foot, look for "Wide" (D/2E) variants rather than just going up a half-size.' }],
      },
      {
        nodeType: "header",
        style: "h3",
        content: [{ nodeType: "text", value: "4. The Flex Test" }],
      },
      {
        nodeType: "paragraph",
        content: [{ nodeType: "text", value: "Check where the shoe bends. It should flex at the ball of the foot, matching your natural gait. If it's too stiff, your calves will overcompensate; if it's too flimsy, you lose the energy return needed for long-distance comfort." }],
      },
      {
        nodeType: "paragraph",
        content: [
          { nodeType: "text", value: '"A shoe that fits right should feel like an extension of your foot, not a piece of equipment you\'re fighting against."', format: { variants: ["italic"] } },
        ],
      },
      {
        nodeType: "header",
        style: "h3",
        content: [{ nodeType: "text", value: "Gear Up" }],
      },
      {
        nodeType: "paragraph",
        content: [{ nodeType: "text", value: "Ready to find your next pair? Check out our latest collections:" }],
      },
      {
        nodeType: "paragraph",
        content: [{ nodeType: "link", value: "Shop Men's Running", data: { href: "/new-arrivals", target: "_self" } }],
      },
      {
        nodeType: "paragraph",
        content: [{ nodeType: "link", value: "Shop Women's Running", data: { href: "/new-arrivals", target: "_self" } }],
      },
      {
        nodeType: "paragraph",
        content: [{ nodeType: "link", value: "New Arrivals", data: { href: "/new-arrivals", target: "_self" } }],
      },
    ],
  },
};

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
        if (res.status === 404 && slug === DEFAULT_BLOG_SLUG) {
          return DEFAULT_BLOG_FULL;
        }
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
        if (slug === DEFAULT_BLOG_SLUG) {
          setBlog(DEFAULT_BLOG_FULL);
        } else {
          setNotFound(true);
        }
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
          <MainNav config={config || {}} />
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
          <MainNav config={config || {}} />
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
  const isAemImage = imageAsset._dynamicUrl || imageAsset._authorUrl;
  const imageSrc = isAemImage
    ? `${(config?.env || "").replace(/\/$/, "")}${imageAsset._dynamicUrl || imageAsset._authorUrl}`
    : typeof image === "string"
      ? image
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
          <Link href="#" className="hover:underline">Find a Store</Link>
          <Link href="#" className="hover:underline">Help</Link>
          <Link href="#" className="hover:underline">Join Us</Link>
          <AuthBar />
        </div>
        {config?.env && <MainNav config={config} />}
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8" {...editorProps}>
          <Link href="/blog" className="inline-block text-sm text-muted-foreground hover:text-foreground mb-6">
            ← Back to blog
          </Link>
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
