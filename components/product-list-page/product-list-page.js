import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpDown, Grid, List, Search, Loader2, Heart, Pencil } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { searchProducts, getProductsBySkus, computeFacetsFromProducts, filterProductsByFacets } from "@/lib/api/plp";
import {
  CATALOG_VIEW_ID,
  DEFAULT_LOCALE,
  DEFAULT_PRICE_BOOK,
  ALL_PRICE_BOOKS,
} from "@/lib/constants";
import { capitalize } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { AmplienceWrapper } from "@/components/amplience/wrapper";
import { PlpFacets } from "./plp-facets";
import { useAuth } from "@/contexts/auth-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { useLoginRequired } from "@/contexts/login-required-context";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductLineEditForm } from "@/components/product-line-edit-form/product-line-edit-form";

import "./product-list-page.css";

const PAGE_SIZE = 25;
const CATEGORY_FETCH_SIZE = 500;

const hasCategory = (p) => {
  const cat = (p.category || "").trim().toLowerCase();
  return cat !== "" && cat !== "no category";
};

const formatPrice = (priceType) => {
  if (
    !priceType?.amount ||
    typeof priceType.amount.value !== "number" ||
    !priceType.amount.currency
  ) {
    return "—";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: priceType.amount.currency,
  }).format(priceType.amount.value);
};

const showDiscount = (price, globalPrice = null) => {
  if (!price?.regular?.amount || !price?.final?.amount) {
    return false;
  }
  // Check if a discount is in place in the selected price book
  if (price.regular.amount.value !== price.final.amount.value) {
    return true;
  }
  // Check if the global price book is different from the selected price book
  if (
    globalPrice?.final?.amount?.value != null &&
    globalPrice.final.amount.value !== price.final.amount.value
  ) {
    return true;
  }
  return false;
};

export function ProductListPage({ content, config }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const aemEditorUrl =
    vse &&
    config?.env &&
    content?._path
      ? `${config.env.replace(/\/$/, "")}/editor.html${content._path.startsWith("/") ? content._path : `/${content._path}`}`
      : null;
  const showPencil = !!vse && !!aemEditorUrl;

  const cart = useCart();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const { showLoginRequiredForFavorites } = useLoginRequired();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState("featured");
  const [productViewMode, setProductViewMode] = useState("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedPriceBook, setSelectedPriceBook] =
    useState(DEFAULT_PRICE_BOOK);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [plpBannerKey, setPlpBannerKey] = useState(null);
  const [plpProductLineKey, setPlpProductLineKey] = useState(null);
  const [productLineContent, setProductLineContent] = useState(null);
  const [productLineProducts, setProductLineProducts] = useState([]);
  const [editProductLineDialogOpen, setEditProductLineDialogOpen] = useState(false);

  const refetchProductLine = useCallback(() => {
    if (!plpProductLineKey) return;
    const params = new URLSearchParams({ key: plpProductLineKey });
    if (vse) params.set("vse", vse);
    params.set("locale", "en-US");
    params.set("_t", Date.now().toString());
    fetch(`/api/amplience/content?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (data._meta || data.productLineType !== undefined || data.searchPhrase !== undefined || Array.isArray(data.skus))) {
          setProductLineContent(data);
        } else {
          setProductLineContent(null);
        }
      })
      .catch(() => setProductLineContent(null));
  }, [plpProductLineKey, vse]);

  // Derive PLP banner and product line delivery keys from content path
  useEffect(() => {
    const path = content?._path;
    if (!path) {
      setPlpBannerKey("plp/slot/top");
      setPlpProductLineKey("plp/product-line");
      return;
    }
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment !== "home") {
      setPlpBannerKey(`plp/${lastSegment}/slot/top`);
      setPlpProductLineKey(`plp/${lastSegment}/product-line`);
    } else {
      setPlpBannerKey("plp/slot/top");
      setPlpProductLineKey("plp/product-line");
    }
  }, [content?._path]);

  // Fetch product line config from Amplience (drives which products appear in grid)
  useEffect(() => {
    refetchProductLine();
  }, [refetchProductLine]);

  // Fetch full product list for category/skuList modes (cached for client-side pagination)
  useEffect(() => {
    const config = productLineContent;
    const type = config?.productLineType;
    if (!config || (type !== "category" && type !== "skuList")) {
      setProductLineProducts([]);
      return;
    }
    let cancelled = false;
    if (type === "skuList") {
      const skus = Array.isArray(config.skus) ? config.skus : [];
      if (skus.length === 0) {
        setProductLineProducts([]);
        return;
      }
      const fetchSkus = async () => {
        if (selectedPriceBook === DEFAULT_PRICE_BOOK) {
          const list = await getProductsBySkus(
            skus,
            CATALOG_VIEW_ID,
            DEFAULT_LOCALE,
            selectedPriceBook
          );
          const bySku = new Map(list.map((p) => [p.sku, p]));
          const ordered = skus.map((sku) => bySku.get(sku)).filter(Boolean);
          if (!cancelled) setProductLineProducts(ordered);
        } else {
          const [selectedList, globalList] = await Promise.all([
            getProductsBySkus(skus, CATALOG_VIEW_ID, DEFAULT_LOCALE, selectedPriceBook),
            getProductsBySkus(skus, CATALOG_VIEW_ID, DEFAULT_LOCALE, DEFAULT_PRICE_BOOK),
          ]);
          const globalMap = new Map(globalList.map((p) => [p.sku, p]));
          const bySku = new Map(selectedList.map((p) => [p.sku, p]));
          const ordered = skus.map((sku) => {
            const p = bySku.get(sku);
            if (!p) return null;
            const globalP = globalMap.get(sku);
            return { ...p, globalPrice: globalP?.price || null };
          }).filter(Boolean);
          if (!cancelled) setProductLineProducts(ordered);
        }
      };
      fetchSkus();
      return () => { cancelled = true; };
    }
    if (type === "category") {
      const cat = (config.category || "").trim().toLowerCase();
      if (!cat) {
        setProductLineProducts([]);
        return;
      }
      const fetchCategory = async () => {
        if (selectedPriceBook === DEFAULT_PRICE_BOOK) {
          const result = await searchProducts(
            CATALOG_VIEW_ID,
            DEFAULT_LOCALE,
            selectedPriceBook,
            "",
            CATEGORY_FETCH_SIZE,
            1
          );
          const filtered = (result.products || []).filter(
            (p) => (p.category || "").toLowerCase() === cat
          );
          if (!cancelled) setProductLineProducts(filtered);
        } else {
          const [selectedResult, globalResult] = await Promise.all([
            searchProducts(CATALOG_VIEW_ID, DEFAULT_LOCALE, selectedPriceBook, "", CATEGORY_FETCH_SIZE, 1),
            searchProducts(CATALOG_VIEW_ID, DEFAULT_LOCALE, DEFAULT_PRICE_BOOK, "", CATEGORY_FETCH_SIZE, 1),
          ]);
          const globalMap = new Map((globalResult.products || []).map((p) => [p.sku, p]));
          const filtered = (selectedResult.products || []).filter(
            (p) => (p.category || "").toLowerCase() === cat
          );
          const merged = filtered.map((p) => ({
            ...p,
            globalPrice: globalMap.get(p.sku)?.price || null,
          }));
          if (!cancelled) setProductLineProducts(merged);
        }
      };
      fetchCategory();
      return () => { cancelled = true; };
    }
  }, [productLineContent, selectedPriceBook]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const plpConfig = productLineContent
    ? {
        productLineType: productLineContent.productLineType || "search",
        searchPhrase: productLineContent.searchPhrase || "",
        category: (productLineContent.category || "").trim().toLowerCase(),
        skus: Array.isArray(productLineContent.skus) ? productLineContent.skus : [],
      }
    : null;

  const loadProducts = useCallback(
    async (page = 1, append = false) => {
      try {
        let products, totalCount;

        // Category or skuList: use cached productLineProducts, filter by search, paginate client-side
        if (plpConfig && (plpConfig.productLineType === "category" || plpConfig.productLineType === "skuList")) {
          const withCategory = productLineProducts.filter(hasCategory);
          const searchLower = debouncedSearchTerm.trim().toLowerCase();
          const filtered = searchLower
            ? withCategory.filter(
                (p) =>
                  (p.name || "").toLowerCase().includes(searchLower) ||
                  (p.sku || "").toLowerCase().includes(searchLower)
              )
            : withCategory;
          totalCount = filtered.length;
          products = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

          if (append) {
            setProducts((prev) => [...prev, ...products]);
          } else {
            setProducts(products);
          }
          setTotalCount(totalCount);
          setCurrentPage(page);
          return;
        }

        // Search type (from config or no config): use searchProducts API
        const effectivePhrase =
          plpConfig && plpConfig.productLineType === "search"
            ? (plpConfig.searchPhrase + " " + debouncedSearchTerm).trim() || plpConfig.searchPhrase
            : debouncedSearchTerm;

        if (selectedPriceBook === DEFAULT_PRICE_BOOK) {
          const result = await searchProducts(
            CATALOG_VIEW_ID,
            DEFAULT_LOCALE,
            selectedPriceBook,
            effectivePhrase,
            PAGE_SIZE,
            page
          );
          products = (result.products || []).filter(hasCategory);
          totalCount = result.totalCount;
        } else {
          const [selectedResult, globalResult] = await Promise.all([
            searchProducts(
              CATALOG_VIEW_ID,
              DEFAULT_LOCALE,
              selectedPriceBook,
              effectivePhrase,
              PAGE_SIZE,
              page
            ),
            searchProducts(
              CATALOG_VIEW_ID,
              DEFAULT_LOCALE,
              DEFAULT_PRICE_BOOK,
              effectivePhrase,
              PAGE_SIZE,
              page
            ),
          ]);
          const globalProductsMap = new Map(
            globalResult.products.map((product) => [product.sku, product])
          );
          const merged = selectedResult.products.map((product) => ({
            ...product,
            globalPrice: globalProductsMap.get(product.sku)?.price || null,
          }));
          products = merged.filter(hasCategory);
          totalCount = selectedResult.totalCount;
        }

        if (append) {
          setProducts((prev) => [...prev, ...products]);
        } else {
          setProducts(products);
        }
        setTotalCount(totalCount);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    },
    [
      debouncedSearchTerm,
      selectedPriceBook,
      plpConfig,
      productLineProducts,
    ]
  );

  useEffect(() => {
    loadProducts(1, false);
  }, [loadProducts]);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await loadProducts(currentPage + 1, true);
    setIsLoadingMore(false);
  };

  // Compute facets from products (client-side)
  const facets = products.length > 0 ? computeFacetsFromProducts(products) : null;

  // Filter products by selected facets
  const filteredProducts = filterProductsByFacets(products, {
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    colors: selectedColors.length > 0 ? selectedColors : undefined,
    sizes: selectedSizes.length > 0 ? selectedSizes : undefined,
    priceRange: selectedPriceRange || undefined,
  });

  const hasMoreProducts = products.length < totalCount;

  const productLineContentId =
    productLineContent?.id ??
    productLineContent?.deliveryId ??
    productLineContent?._meta?.deliveryId ??
    productLineContent?.sys?.id;
  const productLineConfig = productLineContent
    ? {
        productLineType: productLineContent.productLineType || "search",
        searchPhrase: productLineContent.searchPhrase,
        category: productLineContent.category,
        skus: Array.isArray(productLineContent.skus) ? productLineContent.skus : undefined,
      }
    : undefined;
  const showProductLinePencil = !!vse && !!plpProductLineKey;

  const handleProductLineSave = async (payload) => {
    if (!productLineContentId) return;
    const res = await fetch("/api/amplience/content/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: productLineContentId, ...payload }),
    });
    const errBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(errBody.error || `Save failed (${res.status})`);
    }
    refetchProductLine();
  };

  const editorProps = {
    'data-aue-resource': `urn:aemconnection:${content?._path}/jcr:content/data/${content?._variation}`,
    'data-aue-type': 'reference',
    'data-aue-label': 'Product List',
    'data-aue-model': content?._model?._path
  };

  return (
    <div className="product-list-page" {...editorProps}>
      {/* Header */}
      <div className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="header-text">
              <h1 className="header-title" data-aue-prop='title' data-aue-type='text' data-aue-label='Title'>{content.title}</h1>
              <p className="header-subtitle" data-aue-prop='subtitle' data-aue-type='text' data-aue-label='Subtitle'>{content.subtitle}</p>
            </div>

            {/* Search and Filters */}
            <div className="filters-container">
              <div className="search-container">
                <Search className="search-icon" />
                <Input
                  placeholder="Search products..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sort by */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="sort-button bg-transparent"
                  >
                    <ArrowUpDown className="sort-icon" />
                    Sort by
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="sort-dropdown">
                  <DropdownMenuRadioGroup
                    value={sortBy}
                    onValueChange={setSortBy}
                  >
                    <DropdownMenuRadioItem value="featured">
                      Featured
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price-low">
                      Price: Low to High
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="price-high">
                      Price: High to Low
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="rating">
                      Highest Rated
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="newest">
                      Newest
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Price Book Filter */}
              <Select
                value={selectedPriceBook}
                onValueChange={setSelectedPriceBook}
              >
                <SelectTrigger className="w-[175px]">
                  <SelectValue placeholder="Price Book" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_PRICE_BOOKS.map((priceBook) => (
                    <SelectItem key={priceBook} value={priceBook}>
                      {priceBook === "wknd_global"
                        ? "Global Price Book"
                        : "VIP Price Book"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {showPencil && (
                <a
                  href={aemEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Edit product list"
                  className="plp-edit-pencil"
                  aria-label="Edit product list"
                >
                  <Pencil className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results and View Toggle */}
      <div className="main-content">
        <div className="plp-layout">
          {/* Left: Facet filters */}
          <PlpFacets
            facets={facets}
            selectedCategory={selectedCategory}
            selectedColors={selectedColors}
            selectedSizes={selectedSizes}
            selectedPriceRange={selectedPriceRange}
            onCategoryChange={setSelectedCategory}
            onColorChange={setSelectedColors}
            onSizeChange={setSelectedSizes}
            onPriceRangeChange={setSelectedPriceRange}
          />

          {/* Right: Results */}
          <div className="plp-results-area">
            <div className="results-header">
              <p className="results-text">
                Showing{" "}
                <span className="font-medium">1-{filteredProducts.length}</span> of{" "}
                <span className="font-medium">{totalCount}</span> results
              </p>

              <div className="results-header-actions">
                <div className="view-toggle">
                  <Button
                    variant={productViewMode === "grid" ? "outline" : "ghost"}
                    size="sm"
                    className="view-button"
                    onClick={() => setProductViewMode("grid")}
                    aria-label="Grid view"
                    aria-pressed={productViewMode === "grid"}
                  >
                    <Grid className="view-icon" />
                  </Button>
                  <Button
                    variant={productViewMode === "list" ? "outline" : "ghost"}
                    size="sm"
                    className="view-button"
                    onClick={() => setProductViewMode("list")}
                    aria-label="List view"
                    aria-pressed={productViewMode === "list"}
                  >
                    <List className="view-icon" />
                  </Button>
                </div>
                {showProductLinePencil && (
                  <button
                    type="button"
                    onClick={() => setEditProductLineDialogOpen(true)}
                    title="Edit product line (catalog)"
                    className="plp-edit-pencil"
                    aria-label="Edit product line"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <Dialog open={editProductLineDialogOpen} onOpenChange={setEditProductLineDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit product line</DialogTitle>
                </DialogHeader>
                {!productLineContentId && (
                  <p className="text-sm text-muted-foreground">
                    Create content in Amplience with delivery key &quot;{plpProductLineKey}&quot; to enable saving.
                  </p>
                )}
                <ProductLineEditForm
                  initialConfig={productLineConfig}
                  contentId={productLineContentId}
                  onSave={handleProductLineSave}
                  onClose={() => setEditProductLineDialogOpen(false)}
                  showTitle={false}
                  defaultTitle={content?.title || "PLP Product Line"}
                  saveSuccessMessage="Product line updated"
                  noContentMessage={`Create content in Amplience with delivery key "${plpProductLineKey}" to enable saving.`}
                />
              </DialogContent>
            </Dialog>

            {/* Amplience banner slot just above product grid */}
            {plpBannerKey && (
              <div className="plp-banner-slot">
                <AmplienceWrapper fetch={{ key: plpBannerKey }} />
              </div>
            )}

            {/* Product Grid / List */}
            <div className={productViewMode === "list" ? "product-list" : "product-grid"}>
          {filteredProducts.map((product) => (
            <Card key={product.sku} className={`product-card ${productViewMode === "list" ? "product-card-list" : ""}`}>
              <CardContent className="product-card-content">
                <div className="product-image-container product-card-image-wrap">
                  <Link
                    href={`/product/${product.sku}`}
                    className="product-card-link"
                    tabIndex={0}
                  >
                    <div className="product-image-container">
                      <Image
                        src={product.images?.[0]?.url || "/placeholder.svg"}
                        alt={product.name}
                        width={300}
                        height={300}
                        className="product-image"
                      />
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="product-card-favorite"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user) {
                        showLoginRequiredForFavorites();
                      } else {
                        const wasInWishlist = wishlist.isInWishlist(product.sku);
                        wishlist.toggleItem(product);
                        if (wasInWishlist) {
                          toast.info("Removed from favorites", {
                            description: product.name,
                          });
                        } else {
                          toast.success("Added to favorites", {
                            description: product.name,
                          });
                        }
                      }
                    }}
                    aria-label={wishlist.isInWishlist(product.sku) ? "Remove from favorites" : "Add to favorites"}
                  >
                    <Heart
                      className="h-5 w-5"
                      fill={wishlist.isInWishlist(product.sku) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <div className="product-card-main">
                  <Link
                    href={`/product/${product.sku}`}
                    className="product-card-link"
                    tabIndex={0}
                  >
                    <div className="product-info">
                      <div className="product-header">
                        <p className="product-category">
                          {capitalize(product.category) || "No Category"}
                        </p>
                        <h3 className="product-name">{product.name}</h3>
                      </div>
                    </div>
                  </Link>
                  <div className="price-container">
                    <div className="price-info">
                      <span className="current-price">
                        {product.price?.final == null
                          ? "—"
                          : formatPrice(product.price.final)}
                      </span>
                      {product.price &&
                        showDiscount(product.price, product.globalPrice) && (
                        <span className="original-price">
                          {product.globalPrice &&
                          selectedPriceBook !== "wknd_global"
                            ? formatPrice(product.globalPrice.final)
                            : formatPrice(product.price.regular)}
                        </span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="add-to-cart-btn"
                      onClick={() => {
                        cart.addItem(product, { quantity: 1 });
                        toast.success("Added to cart", {
                          description: product.name,
                        });
                      }}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

            {/* Load More */}
            {hasMoreProducts && (
              <div className="load-more-container">
                <Button
                  variant="outline"
                  size="lg"
                  className="load-more-btn bg-transparent"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Products"
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
