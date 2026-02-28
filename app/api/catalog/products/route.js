import { NextResponse } from "next/server";
import {
  searchProducts,
  getProductsBySkus,
} from "@/lib/api/plp";
import {
  CATALOG_VIEW_ID,
  DEFAULT_LOCALE,
  DEFAULT_PRICE_BOOK,
} from "@/lib/constants";

/**
 * GET /api/catalog/products
 * Query params: search (string), pageSize (number, default 10), page (number, default 1),
 *               skus (comma-separated) - fetch specific SKUs for display (e.g. pre-fill)
 * Returns { products: [{ sku, name }], totalCount? }
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const pageSize = Math.min(
    Math.max(parseInt(searchParams.get("pageSize") || "10", 10), 1),
    50
  );
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const skusParam = searchParams.get("skus");

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

    return NextResponse.json({
      products: result.products.map((p) => ({
        sku: p.sku,
        name: p.name,
        image: p.images?.[0]?.url,
      })),
      totalCount: result.totalCount,
    });
  } catch (err) {
    console.error("Catalog products API error:", err);
    return NextResponse.json(
      { error: String(err.message) },
      { status: 500 }
    );
  }
}
