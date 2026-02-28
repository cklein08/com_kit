"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import AEMHeadless from "@adobe/aem-headless-client-js";
import { useCart } from "@/contexts/cart-context";
import { MainNav } from "@/components/main-nav";
import { AuthBar } from "@/components/auth-bar";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero-section/hero-section";
import { EditPencilWrapper } from "@/components/amplience/edit-pencil-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ChevronRight, Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UE_CORS_SCRIPT_URL } from "@/lib/constants";

function formatPrice(price) {
  if (!price) return "—";
  const value = price?.amount?.value ?? price?.value;
  const currency = price?.amount?.currency ?? price?.currency ?? "USD";
  if (typeof value !== "number") return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
}

const SHIPPING_OPTIONS = [
  { id: "standard", label: "Standard", description: "5–7 business days", price: 0 },
  { id: "express", label: "Express", description: "2–3 business days", price: 9.99 },
  { id: "overnight", label: "Overnight", description: "1 business day", price: 24.99 },
];

const PAYMENT_TYPES = [
  { id: "card", label: "Credit / Debit Card", icon: "💳" },
  { id: "paypal", label: "PayPal", icon: "🅿️" },
  { id: "apple", label: "Apple Pay", icon: "🍎" },
];

const EXAMPLE_UPSELL = {
  sku: "WKND-T-Shirt",
  name: "Running Cap",
  price: 24,
  currency: "USD",
  imageUrl: "/running-cap.png",
};

function CartPageLayout({ config, locale, children }) {
  return (
    <>
      <Script src={UE_CORS_SCRIPT_URL} async />
      <div className="flex min-h-screen flex-col bg-white text-gray-900">
        <div className="utility-bar">
          <Link href="/" className="hover:underline">
            Find a Store
          </Link>
          <Link href="/" className="hover:underline">
            Help
          </Link>
          <Link href="/" className="hover:underline">
            Join Us
          </Link>
          <AuthBar />
        </div>
        {config ? <MainNav config={config} locale={locale} /> : null}
        <main
          className="flex-1"
          data-aue-resource="urn:aemconnection:content/site/cart/jcr:content/data/master"
          data-aue-type="container"
          data-aue-label="Cart"
        >
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity } = useCart();
  const [config, setConfig] = useState(null);
  const [locale, setLocale] = useState("en");
  const [step, setStep] = useState(0);
  const [shippingOption, setShippingOption] = useState("standard");
  const [paymentType, setPaymentType] = useState("card");
  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState("");
  const [newArrivalsBanner, setNewArrivalsBanner] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const env = localStorage.getItem("aemEnvironment");
    const project = localStorage.getItem("projectName");
    const savedLocale = localStorage.getItem("locale") || "en";
    setLocale(savedLocale);
    if (env && project) setConfig({ env, project: project });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !config?.env || !config?.project) return;
    const sdk = new AEMHeadless({
      serviceURL: config.env,
      endpoint: "/graphql/execute.json",
      fetch: (resource, options = {}) => {
        if (resource.startsWith("https://author-")) options.credentials = "include";
        return window.fetch(resource, options);
      },
    });
    const path = `/content/dam/${config.project}/site/${locale}/home/home`;
    sdk
      .runPersistedQuery("v0/screenByPath", {
        path,
        variation: "master",
        v1: Math.random().toString(36).substring(2, 15),
      })
      .then(({ data }) => {
        const blocks = data?.screenByPath?.item?.block;
        if (!Array.isArray(blocks)) return;
        const hero = blocks.find(
          (b) =>
            b?._model?.title === "Hero" &&
            (b?.title === "New Arrivals" || /new arrivals/i.test(b?.title ?? ""))
        ) ?? blocks.find((b) => b?._model?.title === "Hero");
        if (hero) setNewArrivalsBanner(hero);
      })
      .catch(() => {});
  }, [config?.env, config?.project, locale]);

  const subtotal = items.reduce(
    (sum, i) => sum + (i.price?.value ?? i.price?.amount?.value ?? 0) * i.quantity,
    0
  );
  const shippingCost = SHIPPING_OPTIONS.find((o) => o.id === shippingOption)?.price ?? 0;
  const discountAmount = appliedPromo?.amount ?? 0;
  const total = Math.max(0, subtotal + shippingCost - discountAmount);

  const handleApplyPromo = () => {
    setPromoError("");
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    if (code === "SAVE10") {
      setAppliedPromo({ code, amount: Math.min(subtotal * 0.1, 25), label: "10% off (max $25)" });
    } else if (code === "FLAT5") {
      setAppliedPromo({ code, amount: 5, label: "$5 off" });
    } else {
      setPromoError("Invalid or expired code");
    }
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  if (orderPlaced) {
    return (
      <CartPageLayout config={config} locale={locale}>
      <div className="bg-gray-50 py-12 px-4">
        <div className="mx-auto max-w-lg rounded-lg bg-white p-8 shadow-sm text-center">
          <div className="mb-4 text-5xl">✓</div>
          <h1 className="text-2xl font-semibold text-gray-900">Order confirmed</h1>
          <p className="mt-2 text-gray-600">
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          <Button asChild className="mt-6">
            <Link href="/">Continue shopping</Link>
          </Button>
        </div>
      </div>
      </CartPageLayout>
    );
  }

  if (items.length === 0 && step === 0) {
    return (
      <CartPageLayout config={config} locale={locale}>
      <div className="bg-gray-50 py-12 px-4">
        <div className="mx-auto max-w-lg rounded-lg bg-white p-8 shadow-sm text-center">
          <ShoppingBag className="mx-auto h-16 w-16 text-gray-300" />
          <h1 className="mt-4 text-2xl font-semibold text-gray-900">Your cart is empty</h1>
          <p className="mt-2 text-gray-600">Add items from the store to get started.</p>
          <Button asChild className="mt-6">
            <Link href="/">Continue shopping</Link>
          </Button>
        </div>
      </div>
      </CartPageLayout>
    );
  }

  const steps = ["Cart", "Shipping", "Payment", "Review"];

  return (
    <CartPageLayout config={config} locale={locale}>
    <div className="bg-gray-50">
      {/* Drop-in: Banners (e.g. promo banners, messaging) */}
      <div
        className="cart-page-banner-slot min-h-[80px] border-b border-gray-200 bg-white px-4 py-3"
        data-slot="cart-banners"
      >
        {/* Drop-in: Add your banner components here (promo strips, messaging, etc.) */}
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Step indicator (cart breadcrumb) */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          {steps.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span
                className={cn(
                  "font-medium",
                  i === step && "text-gray-900",
                  i < step && "text-green-600"
                )}
              >
                {s}
              </span>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </span>
          ))}
        </nav>

        {/* New Arrivals / Back to School banner from homepage (half height) */}
        {config && newArrivalsBanner && (
          <div className="cart-page-new-arrivals-banner mb-8 -mx-4 sm:mx-0">
            <EditPencilWrapper
              href={
                config.env && newArrivalsBanner._path
                  ? `${config.env.replace(/\/$/, "")}/editor.html${newArrivalsBanner._path.startsWith("/") ? newArrivalsBanner._path : `/${newArrivalsBanner._path}`}`
                  : null
              }
              label="banner"
            >
              <HeroSection content={newArrivalsBanner} config={config} />
            </EditPencilWrapper>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <div className={cn("lg:col-span-2", step !== 0 && "space-y-6")}>
            {/* Step 0: Cart */}
            {step === 0 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Cart</h2>
                <ul className="mt-4 divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="flex gap-4 py-4 first:pt-0">
                      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="96px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            <ShoppingBag className="h-8 w-8" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900">{item.name || item.sku || "Item"}</p>
                        {(item.size || item.color) && (
                          <p className="text-sm text-gray-500">
                            {[item.size, item.color].filter(Boolean).join(" · ")}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="rounded border border-gray-300 p-1 hover:bg-gray-100"
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="ml-2 text-red-600 hover:text-red-700"
                            aria-label="Remove item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatPrice(item.price)}
                          {item.quantity > 1 && (
                            <span className="text-sm font-normal text-gray-500">
                              {" "}
                              × {item.quantity}
                            </span>
                          )}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Shipping address</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <Input
                      id="fullName"
                      value={address.fullName}
                      onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="street">Street address</Label>
                    <Input
                      id="street"
                      value={address.street}
                      onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                      placeholder="123 Main St"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                      placeholder="San Francisco"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={address.state}
                      onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))}
                      placeholder="CA"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP code</Label>
                    <Input
                      id="zip"
                      value={address.zip}
                      onChange={(e) => setAddress((a) => ({ ...a, zip: e.target.value }))}
                      placeholder="94102"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={address.country}
                      onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                <h3 className="mt-6 text-lg font-medium text-gray-900">Shipping method</h3>
                <RadioGroup
                  value={shippingOption}
                  onValueChange={setShippingOption}
                  className="mt-2 space-y-3"
                >
                  {SHIPPING_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-colors",
                        shippingOption === opt.id ? "border-primary bg-primary/5" : "border-gray-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={opt.id} id={`ship-${opt.id}`} />
                        <div>
                          <p className="font-medium">{opt.label}</p>
                          <p className="text-sm text-gray-500">{opt.description}</p>
                        </div>
                      </div>
                      <span className="font-medium">
                        {opt.price === 0 ? "Free" : formatPrice({ value: opt.price, currency: "USD" })}
                      </span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Payment method</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Select how you would like to pay. This is a demo; no charges will be made.
                </p>
                <RadioGroup
                  value={paymentType}
                  onValueChange={setPaymentType}
                  className="mt-4 space-y-3"
                >
                  {PAYMENT_TYPES.map((type) => (
                    <label
                      key={type.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors",
                        paymentType === type.id ? "border-primary bg-primary/5" : "border-gray-200"
                      )}
                    >
                      <RadioGroupItem value={type.id} id={`pay-${type.id}`} />
                      <span className="text-2xl">{type.icon}</span>
                      <span className="font-medium">{type.label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">Order summary</h2>
                <ul className="mt-4 divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="flex justify-between py-2 text-sm">
                      <span>
                        {item.name || item.sku} × {item.quantity}
                      </span>
                      <span>{formatPrice(item.price)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-gray-500">
                  Shipping: {SHIPPING_OPTIONS.find((o) => o.id === shippingOption)?.label} —{" "}
                  {shippingCost === 0 ? "Free" : formatPrice({ value: shippingCost, currency: "USD" })}
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Payment: {PAYMENT_TYPES.find((p) => p.id === paymentType)?.label}
                </p>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 space-y-4">
              {/* Drop-in: Coupons / Promo code */}
              <div
                className="rounded-lg bg-white p-4 shadow-sm"
                data-slot="cart-coupons"
              >
                <Label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Tag className="h-4 w-4" />
                  Promo code
                </Label>
                <div className="mt-2 flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value);
                      setPromoError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyPromo();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={handleApplyPromo}>
                    Apply
                  </Button>
                </div>
                {promoError && (
                  <p className="mt-1 text-xs text-red-600">{promoError}</p>
                )}
                {appliedPromo && (
                  <p className="mt-2 text-sm text-green-600">
                    {appliedPromo.label} applied
                  </p>
                )}
                {/* Replace this block with your own coupon component if needed */}
              </div>

              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900">Summary</h3>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Subtotal</dt>
                    <dd>{formatPrice({ value: subtotal, currency: "USD" })}</dd>
                  </div>
                  {step >= 1 && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Shipping</dt>
                      <dd>
                        {shippingCost === 0
                          ? "Free"
                          : formatPrice({ value: shippingCost, currency: "USD" })}
                      </dd>
                    </div>
                  )}
                  {appliedPromo && (
                    <div className="flex justify-between text-green-600">
                      <dt>Discount</dt>
                      <dd>-{formatPrice({ value: discountAmount, currency: "USD" })}</dd>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-medium">
                    <dt>Total</dt>
                    <dd>{formatPrice({ value: total, currency: "USD" })}</dd>
                  </div>
                </dl>
              <div className="mt-6 flex flex-col gap-2">
                {step < 3 ? (
                  <>
                    <Button
                      onClick={() => setStep((s) => Math.min(s + 1, 3))}
                      className="w-full"
                    >
                      {step === 0 ? "Proceed to checkout" : "Continue"}
                    </Button>
                    {step > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setStep((s) => s - 1)}
                        className="w-full"
                      >
                        Back
                      </Button>
                    )}
                  </>
                ) : (
                  <Button onClick={handlePlaceOrder} className="w-full">
                    Place order
                  </Button>
                )}
              </div>
              <Link
                href="/"
                className="mt-4 block text-center text-sm text-gray-500 hover:text-gray-700"
              >
                Continue shopping
              </Link>
            </div>
          </div>
          </div>

          {/* Drop-in: Product upsell / cross-sell (e.g. "You may also like", "Complete your order") */}
          <section
            className="cart-page-upsell-slot col-span-full mt-10 border-t border-gray-200 pt-10"
            data-slot="cart-upsell"
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Complete your order
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {/* Upsell product 1: example product card */}
              <Link
                href={`/product/${EXAMPLE_UPSELL.sku}`}
                className="cart-page-upsell-item group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                data-slot="cart-upsell-item-1"
              >
                <div className="relative aspect-square w-full bg-gray-100">
                  <Image
                    src={EXAMPLE_UPSELL.imageUrl}
                    alt={EXAMPLE_UPSELL.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                </div>
                <div className="flex flex-1 flex-col p-3">
                  <p className="font-medium text-gray-900">{EXAMPLE_UPSELL.name}</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatPrice({ amount: { value: EXAMPLE_UPSELL.price, currency: EXAMPLE_UPSELL.currency } })}
                  </p>
                </div>
              </Link>
              {/* Placeholder slots: replace with your product cards or CMS-driven components */}
              {[2, 3, 4].map((i) => {
                const slotId = "cart-upsell-item-" + i;
                return (
                  <div
                    key={i}
                    className="cart-page-upsell-item flex min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4 text-center text-sm text-gray-500"
                    data-slot={slotId}
                  >
                    Upsell product {i}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
    </CartPageLayout>
  );
}
