"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Heart, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductLineEditForm } from "@/components/product-line-edit-form/product-line-edit-form";
import { capitalize } from "@/lib/utils";
import { useCart } from "@/contexts/cart-context";
import { useAuth } from "@/contexts/auth-context";
import { useWishlist } from "@/contexts/wishlist-context";
import { useLoginRequired } from "@/contexts/login-required-context";
import "./product-detail.css";

function formatPrice(priceType) {
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
}

const CROSS_SELL_ITEMS = [
  { id: "cs1", name: "Runner's belt", price: "$42", image: "https://hips.hearstapps.com/vader-prod.s3.amazonaws.com/1710161202-51dvqFEiGKL.jpg?crop=1.00xw:0.801xh;0,0.0863xh&resize=980:*" },
  { id: "cs2", name: "Care kit", price: "$18", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=128&h=128&fit=crop" },
];
const UPSELL_ITEM = {
  name: "Premium version with extra support",
  price: "$189",
  image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=160&h=160&fit=crop",
  cta: "Upgrade",
};
const YOU_MIGHT_LIKE_ITEMS = [
  { id: "yml1", name: "Classic runner", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=112&h=112&fit=crop" },
  { id: "yml2", name: "Everyday sneaker", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=112&h=112&fit=crop" },
  { id: "yml3", name: "Trail edition", image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=112&h=112&fit=crop" },
];
const BLOG_POST = {
  title: "How to choose the right fit",
  excerpt: "A quick guide to sizing and comfort for all-day wear.",
  image: "https://media.istockphoto.com/id/1210120932/photo/close-up-of-athletic-woman-putting-on-sneakers.jpg?s=612x612&w=0&k=20&c=U4jBfMvYjX0Jl2qj76z2XiMznGlYB9T7dgbFT7HflDw=",
  linkText: "Read more",
};

export function ProductDetail({ variantData, config, productSlug }) {
  const searchParams = useSearchParams();
  const vse = searchParams.get("vse") || searchParams.get("cse");
  const cart = useCart();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const { showLoginRequiredForFavorites } = useLoginRequired();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [productLineContent, setProductLineContent] = useState(null);
  const [productLineContentCrossSell, setProductLineContentCrossSell] = useState(null);
  const [productLineContentUpsell, setProductLineContentUpsell] = useState(null);
  const [recommendationProducts, setRecommendationProducts] = useState([]);
  const [crossSellProducts, setCrossSellProducts] = useState([]);
  const [upsellProduct, setUpsellProduct] = useState(null);
  const [editProductLineDialogOpen, setEditProductLineDialogOpen] = useState(false);
  const [editCrossSellDialogOpen, setEditCrossSellDialogOpen] = useState(false);
  const [editUpsellDialogOpen, setEditUpsellDialogOpen] = useState(false);

  const product = variantData?.product;
  const sizes = variantData?.sizes ?? [];
  const colorVariants = variantData?.colorVariants ?? [];
  const allImages = variantData?.allImages ?? [];

  useEffect(() => {
    if (sizes.length && selectedSize === null) setSelectedSize(sizes[0]);
  }, [sizes, selectedSize]);

  const pdpProductLineKey = product?.sku
    ? `pdp/product-line/${String(product.sku).toUpperCase()}`
    : null;
  const pdpCrossSellKey = product?.sku
    ? `pdp/product-line/${String(product.sku).toUpperCase()}/cross-sell`
    : null;
  const pdpUpsellKey = product?.sku
    ? `pdp/product-line/${String(product.sku).toUpperCase()}/upsell`
    : null;

  const refetchProductLine = useCallback(() => {
    if (!pdpProductLineKey) return;
    const params = new URLSearchParams({ key: pdpProductLineKey });
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
  }, [pdpProductLineKey, vse]);

  useEffect(() => {
    refetchProductLine();
  }, [refetchProductLine]);

  const refetchCrossSell = useCallback(() => {
    if (!pdpCrossSellKey) return;
    const params = new URLSearchParams({ key: pdpCrossSellKey });
    if (vse) params.set("vse", vse);
    params.set("locale", "en-US");
    params.set("_t", Date.now().toString());
    fetch(`/api/amplience/content?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (data._meta || data.productLineType !== undefined || data.searchPhrase !== undefined || Array.isArray(data.skus))) {
          setProductLineContentCrossSell(data);
        } else {
          setProductLineContentCrossSell(null);
        }
      })
      .catch(() => setProductLineContentCrossSell(null));
  }, [pdpCrossSellKey, vse]);

  const refetchUpsell = useCallback(() => {
    if (!pdpUpsellKey) return;
    const params = new URLSearchParams({ key: pdpUpsellKey });
    if (vse) params.set("vse", vse);
    params.set("locale", "en-US");
    params.set("_t", Date.now().toString());
    fetch(`/api/amplience/content?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && (data._meta || data.productLineType !== undefined || data.searchPhrase !== undefined || Array.isArray(data.skus))) {
          setProductLineContentUpsell(data);
        } else {
          setProductLineContentUpsell(null);
        }
      })
      .catch(() => setProductLineContentUpsell(null));
  }, [pdpUpsellKey, vse]);

  useEffect(() => {
    refetchCrossSell();
  }, [refetchCrossSell]);

  useEffect(() => {
    refetchUpsell();
  }, [refetchUpsell]);

  useEffect(() => {
    const config = productLineContent;
    const type = config?.productLineType || "search";
    if (!config) {
      setRecommendationProducts([]);
      return;
    }
    let cancelled = false;
    if (type === "skuList" && Array.isArray(config.skus) && config.skus.length > 0) {
      fetch(`/api/catalog/products?skus=${encodeURIComponent(config.skus.join(","))}`)
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((data) => {
          const bySku = new Map((data.products || []).map((p) => [p.sku, { id: p.sku, sku: p.sku, name: p.name, image: p.image || "/placeholder.svg" }]));
          const ordered = config.skus.map((sku) => bySku.get(sku)).filter(Boolean);
          if (!cancelled) setRecommendationProducts(ordered);
        })
        .catch(() => { if (!cancelled) setRecommendationProducts([]); });
      return () => { cancelled = true; };
    }
    if (type === "category" && config.category?.trim()) {
      fetch(`/api/catalog/products?category=${encodeURIComponent(config.category.trim())}`)
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((data) => {
          const products = (data.products || []).slice(0, 6).map((p) => ({
            id: p.sku,
            sku: p.sku,
            name: p.name,
            image: p.image || "/placeholder.svg",
          }));
          if (!cancelled) setRecommendationProducts(products);
        })
        .catch(() => { if (!cancelled) setRecommendationProducts([]); });
      return () => { cancelled = true; };
    }
    const phrase = (config.searchPhrase || "").trim() || "shoes";
    fetch(`/api/catalog/products?search=${encodeURIComponent(phrase)}&pageSize=6`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => {
        const products = (data.products || []).map((p) => ({
          id: p.sku,
          sku: p.sku,
          name: p.name,
          image: p.image || "/placeholder.svg",
        }));
        if (!cancelled) setRecommendationProducts(products);
      })
      .catch(() => { if (!cancelled) setRecommendationProducts([]); });
    return () => { cancelled = true; };
  }, [productLineContent]);

  const loadProductsFromConfig = useCallback((cfg, limit, setter) => {
    if (!cfg) {
      setter([]);
      return;
    }
    let cancelled = false;
    const type = cfg.productLineType || "search";
    const toItem = (p) => ({
      id: p.sku,
      sku: p.sku,
      name: p.name,
      image: p.image || "/placeholder.svg",
      price: p.price,
    });
    if (type === "skuList" && Array.isArray(cfg.skus) && cfg.skus.length > 0) {
      fetch(`/api/catalog/products?skus=${encodeURIComponent(cfg.skus.join(","))}`)
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((data) => {
          const bySku = new Map((data.products || []).map((p) => [p.sku, toItem(p)]));
          const ordered = cfg.skus.map((sku) => bySku.get(sku)).filter(Boolean);
          if (!cancelled) setter(ordered.slice(0, limit));
        })
        .catch(() => { if (!cancelled) setter([]); });
      return () => { cancelled = true; };
    }
    if (type === "category" && cfg.category?.trim()) {
      fetch(`/api/catalog/products?category=${encodeURIComponent(cfg.category.trim())}`)
        .then((r) => (r.ok ? r.json() : { products: [] }))
        .then((data) => {
          const products = (data.products || []).slice(0, limit).map(toItem);
          if (!cancelled) setter(products);
        })
        .catch(() => { if (!cancelled) setter([]); });
      return () => { cancelled = true; };
    }
    const phrase = (cfg.searchPhrase || "").trim() || "shoes";
    fetch(`/api/catalog/products?search=${encodeURIComponent(phrase)}&pageSize=${limit}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => {
        const products = (data.products || []).slice(0, limit).map(toItem);
        if (!cancelled) setter(products);
      })
      .catch(() => { if (!cancelled) setter([]); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    loadProductsFromConfig(productLineContentCrossSell, 6, setCrossSellProducts);
  }, [productLineContentCrossSell, loadProductsFromConfig]);

  useEffect(() => {
    loadProductsFromConfig(productLineContentUpsell, 1, (items) => {
      setUpsellProduct(items?.[0] ?? null);
    });
  }, [productLineContentUpsell, loadProductsFromConfig]);

  const displayImages = useMemo(() => {
    if (colorVariants.length && colorVariants[selectedColorIndex]?.images?.length) {
      return colorVariants[selectedColorIndex].images;
    }
    return allImages.length ? allImages : product?.images ?? [];
  }, [colorVariants, selectedColorIndex, allImages, product?.images]);

  if (variantData === undefined) {
    return (
      <div className="product-detail product-detail-empty">
        <p>Loading product…</p>
      </div>
    );
  }
  if (variantData === null) {
    return (
      <div className="product-detail product-detail-empty">
        <p>Product not found.</p>
        <Link href="/">Continue shopping</Link>
      </div>
    );
  }

  const mainImage = displayImages[mainImageIndex] ?? displayImages[0];
  const imageUrl = mainImage?.url || product?.images?.[0]?.url || "/placeholder.svg";
  const hasPrice = product?.price?.final != null;

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
  const showProductLinePencil = !!vse && !!pdpProductLineKey && !!product;

  const crossSellContentId =
    productLineContentCrossSell?.id ??
    productLineContentCrossSell?.deliveryId ??
    productLineContentCrossSell?._meta?.deliveryId ??
    productLineContentCrossSell?.sys?.id;
  const crossSellConfig = productLineContentCrossSell
    ? {
        productLineType: productLineContentCrossSell.productLineType || "search",
        searchPhrase: productLineContentCrossSell.searchPhrase,
        category: productLineContentCrossSell.category,
        skus: Array.isArray(productLineContentCrossSell.skus) ? productLineContentCrossSell.skus : undefined,
      }
    : undefined;

  const upsellContentId =
    productLineContentUpsell?.id ??
    productLineContentUpsell?.deliveryId ??
    productLineContentUpsell?._meta?.deliveryId ??
    productLineContentUpsell?.sys?.id;
  const upsellConfig = productLineContentUpsell
    ? {
        productLineType: productLineContentUpsell.productLineType || "search",
        searchPhrase: productLineContentUpsell.searchPhrase,
        category: productLineContentUpsell.category,
        skus: Array.isArray(productLineContentUpsell.skus) ? productLineContentUpsell.skus : undefined,
      }
    : undefined;

  const aemBlogEditorUrl =
    vse &&
    config?.env &&
    productSlug
      ? `${config.env.replace(/\/$/, "")}/editor.html/content/site/product/${productSlug}`
      : null;
  const showBlogPencil = !!vse && !!aemBlogEditorUrl;

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

  const handleCrossSellSave = async (payload) => {
    if (!crossSellContentId) return;
    const res = await fetch("/api/amplience/content/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: crossSellContentId, ...payload }),
    });
    const errBody = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(errBody.error || `Save failed (${res.status})`);
    refetchCrossSell();
  };

  const handleUpsellSave = async (payload) => {
    if (!upsellContentId) return;
    const res = await fetch("/api/amplience/content/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentId: upsellContentId, ...payload }),
    });
    const errBody = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(errBody.error || `Save failed (${res.status})`);
    refetchUpsell();
  };

  const formatPriceDisplay = (p) => {
    if (typeof p === "string") return p;
    if (p?.final?.amount?.value != null)
      return formatPrice(p.final);
    if (p?.regular?.amount?.value != null)
      return formatPrice(p.regular);
    return "—";
  };

  const crossSellItems =
    crossSellProducts.length > 0 ? crossSellProducts : CROSS_SELL_ITEMS;
  const upsellItem = upsellProduct
    ? {
        name: upsellProduct.name,
        price: formatPriceDisplay(upsellProduct.price),
        image: upsellProduct.image,
        cta: "Upgrade",
      }
    : UPSELL_ITEM;

  const youMightLikeItems =
    recommendationProducts.length > 0
      ? recommendationProducts
      : YOU_MIGHT_LIKE_ITEMS;

  return (
    <div className="product-detail">
      <div className="product-detail-layout">
        <div className="product-detail-media">
          <div className="product-detail-main-image-wrap">
            <Image
              src={imageUrl}
              alt={product.name}
              width={600}
              height={600}
              className="product-detail-image"
              priority
            />
          </div>
          {displayImages.length > 1 && (
            <div className="product-detail-gallery">
              {displayImages.map((img, i) => (
                <button
                  key={img.url || i}
                  type="button"
                  className={`product-detail-thumb ${i === mainImageIndex ? "active" : ""}`}
                  onClick={() => setMainImageIndex(i)}
                  aria-label={`View image ${i + 1}`}
                >
                  <Image
                    src={img.url}
                    alt=""
                    width={80}
                    height={80}
                    className="product-detail-thumb-img"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-detail-info">
          {product.category && (
            <p className="product-detail-category">
              {capitalize(product.category)}
            </p>
          )}
          <h1 className="product-detail-title">{product.name}</h1>
          {hasPrice && (
            <div className="product-detail-price">
              <span className="product-detail-price-current">
                {formatPrice(product.price.final)}
              </span>
              {product.price?.regular?.amount?.value !==
                product.price?.final?.amount?.value && (
                <span className="product-detail-price-original">
                  {formatPrice(product.price.regular)}
                </span>
              )}
            </div>
          )}

          {sizes.length > 0 && (
            <div className="product-detail-options">
              <span className="product-detail-option-label">Size</span>
              <div className="product-detail-sizes">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={`product-detail-size-btn ${selectedSize === size ? "active" : ""}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {colorVariants.length > 1 && (
            <div className="product-detail-options">
              <span className="product-detail-option-label">Color</span>
              <div className="product-detail-colors">
                {colorVariants.map((cv, i) => (
                  <button
                    key={cv.color}
                    type="button"
                    className={`product-detail-color-btn ${selectedColorIndex === i ? "active" : ""}`}
                    onClick={() => {
                      setSelectedColorIndex(i);
                      setMainImageIndex(0);
                    }}
                    title={cv.color}
                    aria-label={`Color: ${cv.color}`}
                  >
                    <span className="product-detail-color-swatch">{cv.color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.shortDescription && (
            <div className="product-detail-short-description">
              <h3 className="product-detail-description-heading">Overview</h3>
              <div
                className="product-detail-description product-detail-description-short"
                dangerouslySetInnerHTML={{ __html: product.shortDescription }}
              />
            </div>
          )}
          {product.description && (
            <div className="product-detail-long-description">
              <h3 className="product-detail-description-heading">Details</h3>
              <div
                className="product-detail-description product-detail-description-long"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}
          <div className="product-detail-actions">
            <Button
              size="lg"
              className="product-detail-add-to-cart"
              onClick={() => {
                const selectedColor = colorVariants[selectedColorIndex];
                cart.addItem(product, {
                  quantity: 1,
                  size: selectedSize ?? undefined,
                  color: selectedColor?.color ?? undefined,
                  skuOverride: selectedColor?.sku ?? undefined,
                });
                toast.success("Added to cart", {
                  description: `${product.name}${selectedSize ? ` (${selectedSize})` : ""}${selectedColor?.color ? ` · ${selectedColor.color}` : ""}`,
                });
              }}
            >
              Add to Cart
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="product-detail-add-to-favorites"
              onClick={() => {
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
            >
              <Heart
                className="h-5 w-5 mr-2"
                fill={wishlist.isInWishlist(product.sku) ? "currentColor" : "none"}
              />
              {wishlist.isInWishlist(product.sku) ? "Remove from Favorites" : "Add to Favorites"}
            </Button>
            <Link href="/" className="product-detail-back">
              ← Back to shopping
            </Link>
          </div>
        </div>
        <div className="product-detail-recommendations">
          <section className="product-detail-widget product-detail-cross-sell relative">
            <div className="flex items-center justify-between gap-2">
              <h3 className="product-detail-widget-heading">Complete the look</h3>
              {showProductLinePencil && (
                <button
                  type="button"
                  onClick={() => setEditCrossSellDialogOpen(true)}
                  title="Edit product line (Complete the look)"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
                  aria-label="Edit product line"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            <Dialog open={editCrossSellDialogOpen} onOpenChange={setEditCrossSellDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit product line (Complete the look)</DialogTitle>
                </DialogHeader>
                {!crossSellContentId && (
                  <p className="text-sm text-muted-foreground">
                    Create content in Amplience with delivery key &quot;{pdpCrossSellKey}&quot; to enable saving.
                  </p>
                )}
                <ProductLineEditForm
                  initialConfig={crossSellConfig}
                  contentId={crossSellContentId}
                  onSave={handleCrossSellSave}
                  onClose={() => setEditCrossSellDialogOpen(false)}
                  showTitle={false}
                  defaultTitle="Cross-sell"
                  saveSuccessMessage="Product line updated"
                  noContentMessage={`Create content in Amplience with delivery key "${pdpCrossSellKey}" to enable saving.`}
                />
              </DialogContent>
            </Dialog>
            <div className="product-detail-widget-items product-detail-cross-sell-items">
              {crossSellItems.map((item) => (
                <Link
                  key={item.id || item.sku}
                  href={item.sku ? `/product/${item.sku}` : "#"}
                  className="product-detail-widget-card product-detail-cross-sell-card"
                >
                  <div className="product-detail-widget-card-image-wrap">
                    <Image src={item.image || "/placeholder.svg"} alt="" width={64} height={64} className="product-detail-widget-card-image" />
                  </div>
                  <div className="product-detail-widget-card-body">
                    <span className="product-detail-widget-card-name">{item.name}</span>
                    <span className="product-detail-widget-card-price">
                      {typeof item.price === "string" ? item.price : formatPriceDisplay(item.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="product-detail-widget product-detail-upsell relative">
            <div className="flex items-center justify-between gap-2">
              <h3 className="product-detail-widget-heading">Upgrade for more</h3>
              {showProductLinePencil && (
                <button
                  type="button"
                  onClick={() => setEditUpsellDialogOpen(true)}
                  title="Edit product line (Upgrade for more)"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
                  aria-label="Edit product line"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            <Dialog open={editUpsellDialogOpen} onOpenChange={setEditUpsellDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit product line (Upgrade for more)</DialogTitle>
                </DialogHeader>
                {!upsellContentId && (
                  <p className="text-sm text-muted-foreground">
                    Create content in Amplience with delivery key &quot;{pdpUpsellKey}&quot; to enable saving.
                  </p>
                )}
                <ProductLineEditForm
                  initialConfig={upsellConfig}
                  contentId={upsellContentId}
                  onSave={handleUpsellSave}
                  onClose={() => setEditUpsellDialogOpen(false)}
                  showTitle={false}
                  defaultTitle="Upsell"
                  saveSuccessMessage="Product line updated"
                  noContentMessage={`Create content in Amplience with delivery key "${pdpUpsellKey}" to enable saving.`}
                />
              </DialogContent>
            </Dialog>
            <div className="product-detail-widget-card product-detail-upsell-card">
              <div className="product-detail-widget-card-image-wrap product-detail-upsell-image-wrap">
                <Image src={upsellItem.image || "/placeholder.svg"} alt="" width={80} height={80} className="product-detail-widget-card-image" />
              </div>
              <div className="product-detail-widget-card-body">
                <span className="product-detail-widget-card-name">{upsellItem.name}</span>
                <span className="product-detail-widget-card-price">{upsellItem.price}</span>
                <Button size="sm" variant="outline" className="product-detail-widget-cta">{upsellItem.cta}</Button>
              </div>
            </div>
          </section>
          <section className="product-detail-widget product-detail-you-might-also-like relative">
            <div className="flex items-center justify-between gap-2">
              <h3 className="product-detail-widget-heading">You might also like</h3>
              {showProductLinePencil && (
                <button
                  type="button"
                  onClick={() => setEditProductLineDialogOpen(true)}
                  title="Edit product line (recommendations)"
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
                  aria-label="Edit product line"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            <Dialog open={editProductLineDialogOpen} onOpenChange={setEditProductLineDialogOpen}>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit product line (You might also like)</DialogTitle>
                </DialogHeader>
                {!productLineContentId && (
                  <p className="text-sm text-muted-foreground">
                    Create content in Amplience with delivery key &quot;{pdpProductLineKey}&quot; to enable saving.
                  </p>
                )}
                <ProductLineEditForm
                  initialConfig={productLineConfig}
                  contentId={productLineContentId}
                  onSave={handleProductLineSave}
                  onClose={() => setEditProductLineDialogOpen(false)}
                  showTitle={false}
                  defaultTitle={product?.name || "PDP Product Line"}
                  saveSuccessMessage="Product line updated"
                  noContentMessage={`Create content in Amplience with delivery key "${pdpProductLineKey}" to enable saving.`}
                />
              </DialogContent>
            </Dialog>
            <div className="product-detail-widget-items product-detail-you-might-also-like-items">
              {youMightLikeItems.map((item) => (
                <Link
                  key={item.id || item.sku}
                  href={item.sku ? `/product/${item.sku}` : "#"}
                  className="product-detail-widget-card product-detail-you-might-also-like-card"
                >
                  <div className="product-detail-widget-card-image-wrap">
                    <Image src={item.image || "/placeholder.svg"} alt="" width={56} height={56} className="product-detail-widget-card-image" />
                  </div>
                  <span className="product-detail-widget-card-name">{item.name}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <section className="product-detail-widget product-detail-blog-post product-detail-blog-post-right relative">
          <div className="product-detail-blog-post-inner">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span />
              {showBlogPencil && (
                <a
                  href={aemBlogEditorUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Edit in AEM"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-900"
                  aria-label="Edit blog post in AEM"
                >
                  <Pencil className="h-4 w-4" />
                </a>
              )}
            </div>
            <div className="product-detail-blog-post-image-wrap">
              <Image src={BLOG_POST.image} alt="" width={200} height={120} className="product-detail-blog-post-image" />
            </div>
            <h3 className="product-detail-blog-post-title">{BLOG_POST.title}</h3>
            <p className="product-detail-blog-post-excerpt">{BLOG_POST.excerpt}</p>
            <Link href="#" className="product-detail-blog-post-link">{BLOG_POST.linkText} →</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
