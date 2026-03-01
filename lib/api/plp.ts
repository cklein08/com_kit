import { ACO_URL, CATALOG_VIEW_ID, DEFAULT_LOCALE } from "../constants";

const PRODUCT_SEARCH_QUERY = `query Products($search: String!, $pageSize: Int!, $currentPage: Int!){
  productSearch(
    phrase: $search
    filter: []
    sort: [{ attribute: "relevance", direction: DESC }]
    page_size: $pageSize
    current_page: $currentPage
  ) {
    total_count
    items {
      productView {
        sku
        name
        description
        shortDescription
        images {
          url
        }
        ... on SimpleProductView {
          attributes {
            label
            name
            value
          }
          price {
            regular {
              amount {
                value
                currency
              }
            }
            final {
              amount {
                value
                currency
              }
            }
            roles
          }
        }
      }
    }
  }
}`;

export type ProductSearchResult = {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  products: Product[];
};

export type FacetOption = { value: string; count: number };
export type PriceRangeFacet = { from: number; to: number; count: number };
export type Facets = {
  category: FacetOption[];
  color: FacetOption[];
  size: FacetOption[];
  price: PriceRangeFacet[];
};

const PRICE_RANGES = [
  { from: 0, to: 20, label: "$0 - $19.99" },
  { from: 20, to: 50, label: "$20 - $49.99" },
  { from: 50, to: 100, label: "$50 - $99.99" },
  { from: 100, to: 500, label: "$100 - $499" },
];

const SIZE_ATTR_NAMES = ["size", "variant_size", "option_size", "sizes"];
const COLOR_ATTR_NAMES = ["color", "colour", "variant_color", "option_color"];

function getAttributeValue(product: Product, names: string[]): string | undefined {
  const att = product.attributes?.find((a) =>
    names.some((n) =>
      a.name?.toLowerCase().includes(n) || (a.label?.toLowerCase?.() || "").includes(n)
    )
  );
  return att?.value;
}

/**
 * Compute facets from a product list (client-side, for when API does not return facets).
 */
export function computeFacetsFromProducts(products: Product[]): Facets {
  const categoryCounts = new Map<string, number>();
  const colorCounts = new Map<string, number>();
  const sizeCounts = new Map<string, number>();
  const priceCounts = new Map<string, number>();

  for (const p of products) {
    if (p.category) {
      categoryCounts.set(p.category, (categoryCounts.get(p.category) || 0) + 1);
    }
    const color = getAttributeValue(p, COLOR_ATTR_NAMES);
    if (color) {
      colorCounts.set(color, (colorCounts.get(color) || 0) + 1);
    }
    const size = getAttributeValue(p, SIZE_ATTR_NAMES);
    if (size) {
      sizeCounts.set(size, (sizeCounts.get(size) || 0) + 1);
    }
    const priceVal = p.price?.final?.amount?.value ?? p.price?.regular?.amount?.value;
    if (typeof priceVal === "number") {
      for (const range of PRICE_RANGES) {
        if (priceVal >= range.from && priceVal < range.to) {
          const key = `${range.from}-${range.to}`;
          priceCounts.set(key, (priceCounts.get(key) || 0) + 1);
          break;
        }
      }
      if (priceVal >= 500) {
        priceCounts.set("500+", (priceCounts.get("500+") || 0) + 1);
      }
    }
  }

  return {
    category: Array.from(categoryCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count),
    color: Array.from(colorCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    size: Array.from(sizeCounts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => a.value.localeCompare(b.value)),
    price: PRICE_RANGES.map((r) => ({
      from: r.from,
      to: r.to,
      count: priceCounts.get(`${r.from}-${r.to}`) || 0,
    })).concat(
      priceCounts.get("500+") ? [{ from: 500, to: Infinity, count: priceCounts.get("500+")! }] : []
    ),
  };
}

/**
 * Filter products by selected facets (client-side).
 */
export function filterProductsByFacets(products: Product[], filters: {
  category?: string;
  colors?: string[];
  sizes?: string[];
  priceRange?: string | null;
}): Product[] {
  return products.filter((p) => {
    if (filters.category && filters.category !== "all" && p.category !== filters.category) {
      return false;
    }
    if (filters.colors?.length) {
      const color = getAttributeValue(p, COLOR_ATTR_NAMES);
      if (!color || !filters.colors.includes(color)) return false;
    }
    if (filters.sizes?.length) {
      const size = getAttributeValue(p, SIZE_ATTR_NAMES);
      if (!size || !filters.sizes.includes(size)) return false;
    }
    if (filters.priceRange) {
      const priceVal = p.price?.final?.amount?.value ?? p.price?.regular?.amount?.value;
      if (typeof priceVal !== "number") return false;
      if (filters.priceRange === "500+") {
        if (priceVal < 500) return false;
      } else {
        const [from, to] = filters.priceRange.split("-").map(Number);
        if (priceVal < from || priceVal >= to) return false;
      }
    }
    return true;
  });
}

export type Product = {
  sku: string;
  name: string;
  description: string;
  shortDescription: string;
  images: { url: string }[];
  attributes: { label: string; name: string; value: string }[];
  price: {
    regular: { amount: { value: number; currency: string } };
    final: { amount: { value: number; currency: string } };
  };
};

export async function searchProducts(
  viewId: string = CATALOG_VIEW_ID,
  locale: string = DEFAULT_LOCALE,
  priceBookId: string = "wknd_global",
  searchTerm: string = "",
  pageSize: number = 25,
  currentPage: number = 1
): Promise<ProductSearchResult> {
  try {
    const headers = {
      "Content-Type": "application/json",
      "AC_ENVIRONMENT_ID": viewId,
      "AC-Source-Locale": locale,
      "AC-Price-Book-ID": priceBookId,
    };

    const data = JSON.stringify({
      query: PRODUCT_SEARCH_QUERY,
      variables: {
        search: searchTerm,
        pageSize: pageSize,
        currentPage: currentPage,
      },
    });

    const response = await fetch(ACO_URL, {
      method: "POST",
      headers: headers,
      body: data,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    let products = result?.data?.productSearch?.items || [];

    // Add a top-level category property from the item_category attribute
    products = products.map((item: any) => {
      item.productView.attributes.forEach((element: any) => {
        if (element.name === "item_category") {
          item.productView.category = element.value;
        }
      });
      return item.productView;
    });

    return {
      totalCount: result?.data?.productSearch?.total_count,
      currentPage: result?.data?.productSearch?.current_page,
      pageSize: result?.data?.productSearch?.page_size,
      products: products,
    };
  } catch (error) {
    console.error("Error searching products:", error);
    throw error;
  }
}

export async function getProductBySku(
  sku: string,
  viewId: string = CATALOG_VIEW_ID,
  locale: string = DEFAULT_LOCALE,
  priceBookId: string = "wknd_global"
): Promise<Product | null> {
  const result = await searchProducts(
    viewId,
    locale,
    priceBookId,
    sku,
    1,
    1
  );
  const match = result.products.find(
    (p) => p.sku.toLowerCase() === sku.toLowerCase()
  );
  return match ?? result.products[0] ?? null;
}

/**
 * Fetch multiple products by SKU in parallel (for carousel skuList mode).
 */
export async function getProductsBySkus(
  skus: string[],
  viewId: string = CATALOG_VIEW_ID,
  locale: string = DEFAULT_LOCALE,
  priceBookId: string = "wknd_global"
): Promise<Product[]> {
  if (!skus?.length) return [];
  const results = await Promise.all(
    skus.map((sku) =>
      getProductBySku(sku, viewId, locale, priceBookId)
    )
  );
  return results.filter((p): p is Product => p != null);
}

export type ColorVariant = {
  color: string;
  sku: string;
  images: { url: string }[];
};

export type ProductWithVariants = {
  product: Product;
  sizes: string[];
  colorVariants: ColorVariant[];
  allImages: { url: string }[];
};

export async function getProductWithVariants(
  sku: string,
  viewId: string = CATALOG_VIEW_ID,
  locale: string = DEFAULT_LOCALE,
  priceBookId: string = "wknd_global"
): Promise<ProductWithVariants | null> {
  const result = await searchProducts(
    viewId,
    locale,
    priceBookId,
    sku,
    50,
    1
  );
  if (!result.products.length) return null;

  const products = result.products;
  const product = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase())
    ?? products[0];

  const sizesSet = new Set<string>();
  const colorMap = new Map<string, { sku: string; images: { url: string }[] }>();
  const allImagesMap = new Map<string, { url: string }>();

  for (const p of products) {
    const sizeVal = getAttributeValue(p, SIZE_ATTR_NAMES);
    if (sizeVal) sizesSet.add(sizeVal);
    const colorVal = getAttributeValue(p, COLOR_ATTR_NAMES);
    const imgs = p.images?.filter((i) => i?.url) ?? [];
    for (const img of imgs) {
      if (img.url) allImagesMap.set(img.url, { url: img.url });
    }
    if (colorVal) {
      const existing = colorMap.get(colorVal);
      if (!existing || (imgs.length && !existing.images.length)) {
        colorMap.set(colorVal, { sku: p.sku, images: imgs });
      }
    }
  }

  const colorVariants: ColorVariant[] = Array.from(colorMap.entries()).map(
    ([color, data]) => ({ color, sku: data.sku, images: data.images })
  );

  const allImages = Array.from(allImagesMap.values());
  if (!allImages.length && product.images?.length) {
    allImages.push(...product.images);
  }

  return {
    product,
    sizes: Array.from(sizesSet).sort((a, b) => a.localeCompare(b)),
    colorVariants: colorVariants.length ? colorVariants : [{ color: "Default", sku: product.sku, images: product.images ?? [] }],
    allImages: allImages.length ? allImages : (product.images ?? []),
  };
}
