import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpDown, Grid, List, Search, Loader2, Heart } from "lucide-react";

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
import { searchProducts, computeFacetsFromProducts, filterProductsByFacets } from "@/lib/api/plp";
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

import "./product-list-page.css";

const PAGE_SIZE = 25;

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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);
  const [selectedPriceBook, setSelectedPriceBook] =
    useState(DEFAULT_PRICE_BOOK);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [plpBannerKey, setPlpBannerKey] = useState(null);

  // Derive PLP banner delivery key from content path (e.g. plp/new-arrivals/slot/top or plp/slot/top)
  useEffect(() => {
    const path = content?._path;
    if (!path) {
      setPlpBannerKey("plp/slot/top");
      return;
    }
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    if (lastSegment && lastSegment !== "home") {
      setPlpBannerKey(`plp/${lastSegment}/slot/top`);
    } else {
      setPlpBannerKey("plp/slot/top");
    }
  }, [content?._path]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadProducts = useCallback(
    async (page = 1, append = false) => {
      try {
        let products, totalCount;

        if (selectedPriceBook === DEFAULT_PRICE_BOOK) {
          // Single call for global price book
          const result = await searchProducts(
            CATALOG_VIEW_ID,
            DEFAULT_LOCALE,
            selectedPriceBook,
            debouncedSearchTerm,
            PAGE_SIZE,
            page
          );
          products = result.products;
          totalCount = result.totalCount;
        } else {
          // Dual call: get selected price book data and global price book data to show strikethrough price
          const [selectedResult, globalResult] = await Promise.all([
            searchProducts(
              CATALOG_VIEW_ID,
              DEFAULT_LOCALE,
              selectedPriceBook,
              debouncedSearchTerm,
              PAGE_SIZE,
              page
            ),
            searchProducts(
              CATALOG_VIEW_ID,
              DEFAULT_LOCALE,
              DEFAULT_PRICE_BOOK,
              debouncedSearchTerm,
              PAGE_SIZE,
              page
            ),
          ]);

          // Merge the results by SKU, adding global price to each product
          const globalProductsMap = new Map(
            globalResult.products.map((product) => [product.sku, product])
          );

          products = selectedResult.products.map((product) => ({
            ...product,
            globalPrice: globalProductsMap.get(product.sku)?.price || null,
          }));

          totalCount = selectedResult.totalCount;
        }

        if (append) {
          setProducts((prevProducts) => [...prevProducts, ...products]);
        } else {
          setProducts(products);
        }
        setTotalCount(totalCount);
        setCurrentPage(page);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    },
    [debouncedSearchTerm, selectedPriceBook]
  );

  useEffect(() => {
    loadProducts(1, false);
  }, [debouncedSearchTerm, selectedPriceBook, CATALOG_VIEW_ID]);

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
            </div>
          </div>
        </div>
      </div>

      {/* Results and View Toggle */}
      <div className="main-content">
        {/* Amplience banner slot above results count */}
        {plpBannerKey && (
          <div className="plp-banner-slot">
            <AmplienceWrapper fetch={{ key: plpBannerKey }} />
          </div>
        )}

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

              <div className="view-toggle">
                <Button
                  variant="outline"
                  size="sm"
                  className="view-button bg-transparent"
                >
                  <Grid className="view-icon" />
                </Button>
                <Button variant="ghost" size="sm" className="view-button">
                  <List className="view-icon" />
                </Button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="product-grid">
          {filteredProducts.map((product) => (
            <Card key={product.sku} className="product-card">
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
