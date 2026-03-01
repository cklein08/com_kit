import { NextResponse } from "next/server";
import {
  searchProducts,
  getProductsBySkus,
  computeFacetsFromProducts,
} from "@/lib/api/plp";
import {
  CATALOG_VIEW_ID,
  DEFAULT_LOCALE,
  DEFAULT_PRICE_BOOK,
} from "@/lib/constants";

/**
 * GET /api/catalog/products
 * Query params: search (string), pageSize (number, default 10), page (number, default 1),
 *               skus (comma-separated) - fetch specific SKUs for display (e.g. pre-fill),
 *               includeFacets (boolean) - when true, compute and return facets from products
 * Returns { products: [{ sku, name }], totalCount?, facets? }
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const pageSize = Math.min(
    Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1),
    100
  );
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const skusParam = searchParams.get("skus");
  const includeFacets = searchParams.get("includeFacets") === "true";

  try {
    if (skusParam && skusParam.trim()) {
      const skus = skusParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (skus.length > 0) {
        const products = await getProductsBySkus(
          skus,
          CATALOG_VIEW_ID,
          DEFAULT_LOCALE,
          DEFAULT_PRICE_BOOK
        );
        return NextResponse.json({
          products: products.map((p) => ({
            sku: p.sku,
            name: p.name,
            image: p.images?.[0]?.url,
          })),
        });
      }
    }

    const result = await searchProducts(
      CATALOG_VIEW_ID,
      DEFAULT_LOCALE,
      DEFAULT_PRICE_BOOK,
      search,
      pageSize,
      page
    );

    const response = {
      products: result.products.map((p) => ({
        sku: p.sku,
        name: p.name,
        image: p.images?.[0]?.url,
      })),
      totalCount: result.totalCount,
    };

    if (includeFacets && result.products.length > 0) {
      response.facets = computeFacetsFromProducts(result.products);
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error("Catalog products API error:", err);
    return NextResponse.json(
      { error: String(err.message) },
      { status: 500 }
    );
  }
}
