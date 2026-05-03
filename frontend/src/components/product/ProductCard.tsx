import { useEffect, useState, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import { Share2, ShoppingCart } from "lucide-react";
import { motion } from "framer-motion";
import type { Product } from "@/data/products";
import { useCart } from "@/contexts/CartContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { shareOrCopy } from "@/lib/share";

const FALLBACK_PRODUCT_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" rx="32" fill="#f4f4f5"/><rect x="56" y="56" width="288" height="288" rx="28" fill="#e4e4e7"/><path d="M104 274l66-76 44 48 30-28 56 56H104z" fill="#c4c4c8"/><circle cx="144" cy="154" r="24" fill="#d4d4d8"/></svg>'
)}`;

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const { addToCart } = useCart();
  const isMobile = useIsMobile();

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

  useEffect(() => {
    setHasImageError(false);
  }, [product.id, product.image, product.hoverImage]);

  const imageSrc = hasImageError
    ? FALLBACK_PRODUCT_IMAGE
    : isHovered && (product.hoverImage || product.images?.[1])
    ? product.hoverImage || product.images?.[1] || FALLBACK_PRODUCT_IMAGE
    : product.image || product.images?.[0] || FALLBACK_PRODUCT_IMAGE;

  const hasAlternateImage = Boolean(product.hoverImage || product.images?.[1]);

  const showQuickAdd = !isMobile && isHovered;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={!isMobile ? { scale: 1, y: -4 } : undefined}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 0.15 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group bg-card rounded-2xl border-2 border-border/50 hover:border-primary hover:border-[3px] overflow-hidden shadow-md hover:shadow-[0_20px_50px_rgba(255,140,0,0.4)] transition-all duration-100 h-full flex flex-col"
    >
      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative aspect-square overflow-hidden bg-muted/30 block flex-shrink-0">
        <button
          type="button"
          aria-label="Share product"
          onClick={handleShare}
          className="absolute top-3 right-3 z-20 inline-flex items-center justify-center rounded-full bg-background/80 backdrop-blur border border-border p-2 text-foreground/80 hover:text-primary hover:bg-background transition-colors"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <img
          src={imageSrc}
          alt={product.title}
          className="w-full h-full object-cover"
          loading={index < 4 ? "eager" : "lazy"}
          fetchPriority={index < 4 ? "high" : "auto"}
          decoding="async"
          onError={() => {
            // If hover image fails on desktop, retry with primary image before showing placeholder.
            if (isHovered && hasAlternateImage) {
              setIsHovered(false);
              return;
            }
            setHasImageError(true);
          }}
        />
        {product.badge && (
          <motion.span
            animate={{ rotate: isHovered ? [0, -10, 10, -10, 0] : 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-3 left-3 text-[10px] font-semibold px-2 py-0.5 rounded-full text-primary-foreground ${
              product.badge === "sale"
                ? "bg-badge-sale"
                : product.badge === "new"
                ? "bg-badge-new"
                : "bg-primary"
            }`}
          >
            {product.badge === "sale" ? `-${product.discount}%` : product.badge === "new" ? "NEW" : "BEST"}
          </motion.span>
        )}
        {/* Quick Add (desktop/hover only) */}
        {!isMobile && (
          <motion.div
            initial={false}
            animate={{ y: showQuickAdd ? 0 : "100%", opacity: showQuickAdd ? 1 : 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent"
          >
            <div>
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(product);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.08 }}
                className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-hover transition-colors duration-100 shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </motion.button>
            </div>
          </motion.div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 bg-gradient-to-b from-background to-muted/20 flex flex-col flex-1">
        <Link to={`/product/${product.id}`}>
          <motion.h3 
            className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-100 h-10"
            animate={{ x: isHovered ? 2 : 0 }}
            transition={{ duration: 0.1 }}
          >
            {product.title}
          </motion.h3>
        </Link>
        <motion.div 
          className="flex items-center gap-2 mt-auto"
          animate={{ 
            scale: isHovered ? 1.05 : 1,
            x: isHovered ? 2 : 0 
          }}
          transition={{ duration: 0.1 }}
        >
          <span className="font-bold text-foreground group-hover:text-primary transition-colors duration-100">₹{product.price.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground line-through">₹{product.mrp.toLocaleString()}</span>
          {!isMobile && (
            <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1 py-0.5 rounded group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-100">{product.discount}% off</span>
          )}
        </motion.div>

        {/* Mobile Add to Cart (pinned to card bottom) */}
        {isMobile && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => addToCart(product)}
              className="w-full py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
