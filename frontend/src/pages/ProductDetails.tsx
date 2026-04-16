import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Star,
  ShoppingCart,
  Zap,
  Minus,
  Plus,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ImageGallery } from "@/components/product/ImageGallery";
import { ProductTabs } from "@/components/product/ProductTabs";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { useCart } from "@/contexts/CartContext";
import { getProductDetail, getRelatedProducts } from "@/data/productDetails";
import type { Product, ProductVariant } from "@/data/products";
import type { ProductDetail } from "@/data/productDetails";
import { api } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const { addToCart } = useCart();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    // Scroll to top immediately when product ID changes
    window.scrollTo({ top: 0, behavior: "auto" });

    // Clear previous product data immediately
    setProduct(null);
    setQuantity(1);
    setSelectedVariant(null);
    setRelatedProducts([]);

    const buildDetail = (
      base: Product & Partial<ProductDetail>,
    ): ProductDetail => {
      const images =
        base.images && base.images.length > 0
          ? base.images
          : [base.image, base.hoverImage].filter(Boolean);

      return {
        ...base,
        brand: base.brand || "TechBrand",
        description:
          base.description ||
          `Experience premium quality with the ${base.title}.`,
        images: images.length > 0 ? images : [base.image],
        specifications: base.specifications || [],
        availability: base.availability || "In Stock",
        deliveryInfo: base.deliveryInfo || "Free delivery in 2-5 days.",
        returnPolicy:
          base.returnPolicy || "7-day replacement policy. Easy returns.",
        reviews: base.reviews || [],
        ratingBreakdown: base.ratingBreakdown || [],
        variants: base.variants || [],
      } as ProductDetail;
    };

    const load = async () => {
      setLoading(true);

      try {
        const apiProduct = await api.fetchProduct(id);
        const detailed = buildDetail(apiProduct as ProductDetail);
        if (!isMounted) return;
        setProduct(detailed);

        const related = await api.fetchProducts({
          category: detailed.category,
          limit: 8,
        });
        if (!isMounted) return;
        setRelatedProducts(
          related.items.filter((p) => p.id !== detailed.id).slice(0, 8),
        );
      } catch {
        const fallback = getProductDetail(id);
        if (!fallback) {
          if (isMounted) setProduct(null);
        } else {
          setProduct(fallback);
          setRelatedProducts(getRelatedProducts(id));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Auto-select first variant when product loads
  useEffect(() => {
    if (
      product &&
      product.variants &&
      product.variants.length > 0 &&
      !selectedVariant
    ) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  if (loading && !product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading product...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Product Not Found
            </h1>
            <p className="text-muted-foreground mb-4">
              The product you're looking for doesn't exist.
            </p>
            <Link to="/" className="text-primary font-semibold hover:underline">
              Go back home
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get current price and display data based on selected variant
  const currentPrice = selectedVariant?.price || product.price;
  const currentMrp = selectedVariant?.mrp || product.mrp;
  const currentDiscount = selectedVariant?.discount || product.discount;
  const currentImages =
    selectedVariant?.images && selectedVariant.images.length > 0
      ? selectedVariant.images
      : product.images;
  const currentStock =
    selectedVariant?.stock !== undefined ? selectedVariant.stock : 100; // Default to available
  const currentAvailability = currentStock > 0 ? "In Stock" : "Out of Stock";

  // Get unique colors and storage options from variants that admin added
  const availableColors = product.variants
    ? [
        ...new Set(
          product.variants
            .filter((v) => v.attributes?.color)
            .map((v) => v.attributes!.color!),
        ),
      ]
    : [];
  const availableStorage = product.variants
    ? [
        ...new Set(
          product.variants
            .filter((v) => v.attributes?.storage)
            .map((v) => v.attributes!.storage!),
        ),
      ]
    : [];

  // Get color hex codes - comprehensive color map for mobile variants
  const getColorHex = (color: string): string => {
    const colorMap: Record<string, string> = {
      // Basic colors
      black: "#1a1a1a",
      white: "#FFFFFF",
      gray: "#808080",
      grey: "#808080",

      // Metallic colors (common in phones)
      silver: "#C0C0C0",
      gold: "#FFD700",
      "rose gold": "#E0BFB8",
      rosegold: "#E0BFB8",
      "space gray": "#535355",
      "space grey": "#535355",
      spacegray: "#535355",
      midnight: "#232733",
      starlight: "#FAF6F3",
      graphite: "#41424C",

      // Primary colors
      red: "#FF0000",
      blue: "#0071E3",
      green: "#4CD964",
      yellow: "#FFD700",
      orange: "#FF8C42",
      purple: "#AF52DE",
      pink: "#FF2D55",

      // Extended colors
      navy: "#000080",
      "navy blue": "#000080",
      "sky blue": "#87CEEB",
      "light blue": "#ADD8E6",
      "dark blue": "#00008B",
      coral: "#FF7F50",
      mint: "#98FF98",
      "mint green": "#98FF98",
      lavender: "#E6E6FA",
      violet: "#8F00FF",
      burgundy: "#800020",
      maroon: "#800000",
      brown: "#964B00",
      beige: "#F5F5DC",
      cream: "#FFFDD0",
      titanium: "#878681",
      bronze: "#CD7F32",
      copper: "#B87333",
      champagne: "#F7E7CE",
    };

    const normalizedColor = color.toLowerCase().trim();
    return colorMap[normalizedColor] || "#808080";
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedVariant || undefined);
    }
    const variantText =
      selectedVariant?.attributes?.color || selectedVariant?.attributes?.storage
        ? ` (${[selectedVariant?.attributes?.color, selectedVariant?.attributes?.storage].filter(Boolean).join(" - ")})`
        : "";
    toast({
      title: "Added to Cart!",
      description: `${quantity}x ${product.title}${variantText} added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedVariant || undefined);
    }
    toast({
      title: "Proceeding to Checkout",
      description: `${product.title} added. Redirecting...`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <CartDrawer />

      <main className="flex-1 pt-0 pb-24 md:pb-12 bg-[#f5f5f5]">
        {/* Breadcrumb */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="capitalize">
              {product.category.replace(/-/g, " ")}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground truncate max-w-[200px]">
              {product.title}
            </span>
          </nav>
        </div>

        {/* Main product section */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-[40%_60%] gap-6 lg:gap-10">
            {/* Left: Image Gallery */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-border/50">
                <ImageGallery images={currentImages} title={product.title} />
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="bg-white rounded-xl p-4 lg:p-8 shadow-sm border border-border/50">
              <div className="space-y-4 lg:space-y-6">
                {/* Brand */}
                <div>
                  <Link
                    to="#"
                    className="inline-block text-xs lg:text-sm font-semibold text-primary hover:underline mb-1.5"
                  >
                    {product.brand}
                  </Link>
                  {/* Title */}
                  <h1 className="text-xl lg:text-3xl xl:text-2xl font text-foreground leading-tight">
                    {product.title}
                  </h1>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-0.5 bg-primary/10 px-2 py-1 rounded-md">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    <span className="text-xs font-semibold text-primary">
                      {product.rating}
                    </span>
                  </div>
                  <span className="text-xs lg:text-sm text-muted-foreground">
                    ({product.reviewCount.toLocaleString()} reviews)
                  </span>
                </div>

                {/* Price */}
                <div className="bg-muted/30 rounded-xl p-3 lg:p-4 space-y-2">
                  <div className="flex items-baseline gap-2.5 flex-wrap">
                    <span className="text-2xl lg:text-3xl font-bold text-foreground">
                      ₹{currentPrice.toLocaleString()}
                    </span>
                    <span className="text-lg lg:text-xl text-muted-foreground line-through">
                      ₹{currentMrp.toLocaleString()}
                    </span>
                    <span className="text-sm lg:text-base font-bold text-white bg-green-600 px-2.5 py-0.5 rounded-md">
                      {currentDiscount}% off
                    </span>
                  </div>
                  {product.emi && (
                    <p className="text-xs text-muted-foreground">
                      {product.emi}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Inclusive of all taxes
                  </p>
                </div>

                {/* Availability */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      currentAvailability === "In Stock"
                        ? "bg-badge-new"
                        : "bg-destructive"
                    }`}
                  />
                  <span
                    className={`text-xs lg:text-sm font-medium ${
                      currentAvailability === "In Stock"
                        ? "text-badge-new"
                        : "text-destructive"
                    }`}
                  >
                    {currentAvailability}
                  </span>
                </div>

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Variants Section */}
                {product.variants && product.variants.length > 0 && (
                  <div className="space-y-5">
                    {/* Color Selection */}
                    {availableColors.length > 0 && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs lg:text-sm font-semibold text-foreground">
                            Colour:
                          </span>
                          <span className="text-xs lg:text-sm text-muted-foreground capitalize">
                            {selectedVariant?.attributes?.color ||
                              availableColors[0]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {availableColors.map((color) => {
                            // Find variant with this color (prioritize one that matches current storage if any)
                            const variant = selectedVariant?.attributes?.storage
                              ? product.variants!.find(
                                  (v) =>
                                    v.attributes?.color === color &&
                                    v.attributes?.storage ===
                                      selectedVariant.attributes?.storage,
                                ) ||
                                product.variants!.find(
                                  (v) => v.attributes?.color === color,
                                )
                              : product.variants!.find(
                                  (v) => v.attributes?.color === color,
                                );

                            const isSelected =
                              selectedVariant?.attributes?.color === color ||
                              (!selectedVariant &&
                                color === availableColors[0]);
                            return (
                              <button
                                key={color}
                                onClick={() => setSelectedVariant(variant)}
                                className={`relative group`}
                              >
                                <div
                                  className={`w-12 h-12 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl border-2 transition-all ${
                                    isSelected
                                      ? "border-primary shadow-md scale-105"
                                      : "border-border hover:border-primary/50"
                                  }`}
                                  style={{
                                    backgroundColor: getColorHex(color),
                                  }}
                                >
                                  {(color.toLowerCase().includes("white") ||
                                    color.toLowerCase().includes("starlight") ||
                                    color.toLowerCase().includes("cream")) && (
                                    <div className="absolute inset-0 rounded-xl border border-black-200" />
                                  )}
                                </div>
                                {variant?.price && (
                                  <div className="absolute -bottom-4.5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-medium text-foreground">
                                    ₹{variant.price.toLocaleString()}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 mt-1.5 mb-5">
                      {/* color options */}
                    </div>

                    {/* Storage/Size Selection */}
                    {availableStorage.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-base font-semibold text-foreground">
                            Size:
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {selectedVariant?.attributes?.storage ||
                              availableStorage[0]}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {availableStorage.map((storage) => {
                            // Find variant with this storage (prioritize one that matches current color if any)
                            const variant = selectedVariant?.attributes?.color
                              ? product.variants!.find(
                                  (v) =>
                                    v.attributes?.storage === storage &&
                                    v.attributes?.color ===
                                      selectedVariant.attributes?.color,
                                ) ||
                                product.variants!.find(
                                  (v) => v.attributes?.storage === storage,
                                )
                              : product.variants!.find(
                                  (v) => v.attributes?.storage === storage,
                                );

                            const isSelected =
                              selectedVariant?.attributes?.storage ===
                                storage ||
                              (!selectedVariant &&
                                storage === availableStorage[0]);
                            return (
                              <button
                                key={storage}
                                onClick={() => setSelectedVariant(variant)}
                                className={`px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/5 text-primary scale-105"
                                    : "border-border hover:border-primary/50 text-foreground"
                                }`}
                              >
                                {storage}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Variant Specifications */}
                {selectedVariant &&
                  (product.category === "mobiles" ||
                    product.category?.includes("mobile")) && (
                    <div className="p-5 bg-muted/30 rounded-xl border border-border space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="font-semibold text-foreground">
                          Brand
                        </span>
                        <span className="text-muted-foreground">
                          {product.brand}
                        </span>
                      </div>
                      {selectedVariant.attributes?.storage && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-foreground">
                            Memory Storage Capacity
                          </span>
                          <span className="text-muted-foreground">
                            {selectedVariant.attributes.storage}
                          </span>
                        </div>
                      )}
                      {selectedVariant.attributes?.ram && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-foreground">
                            RAM Memory Installed Size
                          </span>
                          <span className="text-muted-foreground">
                            {selectedVariant.attributes.ram}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {/* Divider */}
                <div className="border-t border-border" />

                {/* Short description */}
                {/* <p className="text-sm text-foreground/70 leading-relaxed">
                {product.description}
              </p> */}

                {/* Quantity + Actions */}
                <div className="space-y-4">
                  {/* Quantity */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs lg:text-sm font-medium text-foreground">
                      Qty:
                    </span>
                    <div className="flex items-center border border-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-10 h-8 lg:w-12 lg:h-10 flex items-center justify-center text-xs lg:text-sm font-semibold border-x border-border">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddToCart}
                      className="py-3 bg-primary text-primary-foreground font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5 hover:bg-primary-hover transition-colors shadow-md"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleBuyNow}
                      className="py-3 bg-foreground text-background font-semibold text-sm rounded-lg flex items-center justify-center gap-1.5 hover:bg-foreground/90 transition-colors shadow-md"
                    >
                      <Zap className="w-4 h-4" />
                      Buy Now
                    </motion.button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 lg:mt-12">
          <div className="bg-white rounded-xl shadow-sm border border-border/50 overflow-hidden">
            <ProductTabs product={product} />
          </div>
        </div>

        {/* Related Products */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-8 lg:mt-12">
          <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6">
            <RelatedProducts products={relatedProducts} />
          </div>
        </div>
      </main>

      {/* Mobile sticky bottom bar */}
      {isMobile && (
        <div className="fixed bottom-16 left-0 right-0 bg-background border-t-2 border-border p-3 flex items-center gap-3 z-40 shadow-lg">
          <div className="flex-1">
            <span className="text-lg font-semibold text-foreground">
              ₹{currentPrice.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground line-through ml-1.5">
              ₹{currentMrp.toLocaleString()}
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs shadow-md"
          >
            Add to Cart
          </motion.button>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetails;
