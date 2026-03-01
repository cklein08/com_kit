import { NextResponse } from "next/server";
import AEMHeadless from "@adobe/aem-headless-client-js";
import {
  DEFAULT_AEM_EDITOR_URL,
  DEFAULT_AEM_PROJECT,
} from "@/lib/constants";

const AEM_SERVICE_URL =
  process.env.NEXT_PUBLIC_AEM_EDITOR_URL ?? DEFAULT_AEM_EDITOR_URL;
const AEM_PROJECT =
  process.env.NEXT_PUBLIC_AEM_PROJECT ?? DEFAULT_AEM_PROJECT;

/**
 * GET /api/aem/blog?productSlug=kobe-VIII-protro
 * GET /api/aem/blog?slug=how-to-choose-fit
 * GET /api/aem/blog?list=true&limit=5
 *
 * Fetches blog content fragments from AEM via persisted GraphQL queries.
 * Requires AEM Content Fragment Model "Blog" and persisted queries:
 * - v0/blogByProductSlug
 * - v0/blogBySlug
 * - v0/blogList
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const productSlug = searchParams.get("productSlug");
  const slug = searchParams.get("slug");
  const list = searchParams.get("list") === "true";
  const limit = Number.parseInt(searchParams.get("limit") || "10", 10);

  if (!productSlug && !slug && !list) {
    return NextResponse.json(
      { error: "Missing productSlug, slug, or list=true" },
      { status: 400 }
    );
  }

  try {
    const sdk = new AEMHeadless({
      serviceURL: AEM_SERVICE_URL,
      endpoint: "/graphql/execute.json",
    });

    if (productSlug) {
      const { data } = await sdk.runPersistedQuery(
        `${AEM_PROJECT}/blogByProductSlug`,
        {
          productSlug: productSlug.toUpperCase(),
        }
      );
      const items = data?.blogList?.items ?? [];
      const blog = items.length > 0 ? items[0] : null;
      return NextResponse.json(blog);
    }

    if (slug) {
      const { data } = await sdk.runPersistedQuery(
        `${AEM_PROJECT}/blogBySlug`,
        { slug }
      );
      const items = data?.blogList?.items ?? [];
      const blog = items.length > 0 ? items[0] : null;
      if (!blog) {
        return NextResponse.json(
          { error: "Blog not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(blog);
    }

    if (list) {
      const { data } = await sdk.runPersistedQuery(
        `${AEM_PROJECT}/blogList`,
        { limit }
      );
      const items = data?.blogList?.items ?? [];
      return NextResponse.json(items);
    }

    return NextResponse.json(
      { error: "Invalid parameters" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[api/aem/blog]", err);
    return NextResponse.json(
      { error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
