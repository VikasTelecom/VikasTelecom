import { Link } from "react-router-dom";
import { useMemo, type MouseEvent } from "react";
import { useCart } from "@/contexts/CartContext";
import type { Product } from "@/data/products";
import { Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { shareOrCopy } from "@/lib/share";

const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" rx="24" fill="#f4f4f5"/><rect x="56" y="56" width="288" height="288" rx="22" fill="#e4e4e7"/><path d="M104 274l66-76 44 48 30-28 56 56H104z" fill="#c4c4c8"/><circle cx="144" cy="154" r="24" fill="#d4d4d8"/></svg>'
)}`;

function formatINR(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function getDiscountPercent(price: number, mrp?: number, discount?: number) {
  if (typeof discount === "number" && discount > 0) return Math.round(discount);
  if (typeof mrp === "number" && mrp > 0 && mrp > price) {
    return Math.round(((mrp - price) / mrp) * 100);
  }
  return 0;
}

export function AmazonMobileProductCard({
  product,
}: {
  product: Product;
}) {
  const { addToCart } = useCart();

  const handleShare = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const url = new URL(`/product/${product.slug || product.id}`, window.location.origin).toString();
    const result = await shareOrCopy({
      title: product.title,
      text: product.title,
      url,
    });

    if (result === "copied") {
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard.",
      });
    } else if (result === "failed") {
      toast({
        title: "Unable to share",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const discountPercent = useMemo(
    () => getDiscountPercent(product.price, product.mrp, product.discount),
    [product.discount, product.mrp, product.price],
  );

  const currentPrice = product.price;
  const originalPrice = product.mrp && product.mrp > product.price ? product.mrp : undefined;

  return (
    <div className="bg-card rounded-xl shadow-card border border-border overflow-hidden transition-transform duration-150 active:scale-[0.99]">
      <Link to={`/product/${product.id}`} className="block">
        <div className="bg-white relative">
          <button
            type="button"
            aria-label="Share product"
            onClick={handleShare}
            className="absolute top-2 right-2 z-20 inline-flex items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border p-2 text-foreground/80 hover:text-primary hover:bg-background transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <div className="aspect-square w-full flex items-center justify-center p-2">
            <img
              src={product.image || product.images?.[0] || FALLBACK_IMAGE}
              alt={product.title}
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </div>
        </div>

        <div className="p-3 space-y-2">
          <p className="text-[15px] leading-snug font-medium text-foreground line-clamp-2 min-h-[2.5rem]">
            {product.generalName || product.title}
          </p>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              {discountPercent > 0 && (
                <span className="text-sm font-semibold text-destructive">-{discountPercent}%</span>
              )}
              <span className="text-[19px] font-bold text-foreground">
                {formatINR(currentPrice)}
              </span>
              {originalPrice !== undefined && (
                <span className="text-[12px] text-muted-foreground line-through">
                  {formatINR(originalPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={() => addToCart(product)}
          className="w-full rounded-full py-2.5 text-[14px] font-bold text-black bg-[hsl(var(--cta-yellow))] hover:bg-[hsl(var(--cta-yellow-hover))] transition-colors"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
