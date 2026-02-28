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
        console.log(element);
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

function getAttributeValue(
  product: Product,
  names: string[]
): string | undefined {
  const att = product.attributes?.find((a) =>
    names.some((n) =>
      a.name?.toLowerCase().includes(n) || a.label?.toLowerCase().includes(n)
    )
  );
  return att?.value;
}

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

  const sizeNames = ["size", "variant_size", "option_size", "sizes"];
  const colorNames = ["color", "colour", "variant_color", "option_color"];
  const sizesSet = new Set<string>();
  const colorMap = new Map<string, { sku: string; images: { url: string }[] }>();
  const allImagesMap = new Map<string, { url: string }>();

  for (const p of products) {
    const sizeVal = getAttributeValue(p, sizeNames);
    if (sizeVal) sizesSet.add(sizeVal);
    const colorVal = getAttributeValue(p, colorNames);
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
