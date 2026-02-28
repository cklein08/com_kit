"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function ProductDetail({ variantData }) {
  const cart = useCart();
  const { user } = useAuth();
  const wishlist = useWishlist();
  const { showLoginRequiredForFavorites } = useLoginRequired();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [mainImageIndex, setMainImageIndex] = useState(0);

  const product = variantData?.product;
  const sizes = variantData?.sizes ?? [];
  const colorVariants = variantData?.colorVariants ?? [];
  const allImages = variantData?.allImages ?? [];

  useEffect(() => {
    if (sizes.length && selectedSize === null) setSelectedSize(sizes[0]);
  }, [sizes, selectedSize]);

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
      </div>
    </div>
  );
}
