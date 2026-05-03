import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { X, ChevronDown, ChevronUp, Loader2, Package, Search } from "lucide-react";
import { useCategories } from "@/contexts/CategoriesContext";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";
import { Input } from "@/components/ui/input";

const fallbackImage = "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=80&h=80&fit=crop";

interface Props {
  onClose: () => void;
}

export const MobileCategoriesPanel = ({ onClose }: Props) => {
  const { categories: allCategories, loading } = useCategories();
  const categories = allCategories.filter((cat) => cat.status !== "inactive");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [loadingProducts, setLoadingProducts] = useState<Record<string, boolean>>({});

  const filteredCategories = (() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => {
      const title = String(c.title || "").toLowerCase();
      const slug = String(c.slug || "").toLowerCase();
      return title.includes(q) || slug.includes(q);
    });
  })();

  useEffect(() => {
    if (query.trim().length > 0) setExpanded(null);
  }, [query]);

  const toggle = async (categorySlug: string, title: string) => {
    if (expanded === title) {
      setExpanded(null);
    } else {
      setExpanded(title);
      
      // Fetch products if not already loaded
      if (!categoryProducts[categorySlug]) {
        setLoadingProducts((prev) => ({ ...prev, [categorySlug]: true }));
        try {
          const data = await api.fetchProducts({ category: categorySlug, limit: 5 });
          setCategoryProducts((prev) => ({ ...prev, [categorySlug]: data.items as Product[] }));
        } catch (error) {
          console.error("Failed to load products:", error);
          setCategoryProducts((prev) => ({ ...prev, [categorySlug]: [] }));
        } finally {
          setLoadingProducts((prev) => ({ ...prev, [categorySlug]: false }));
        }
      }
    }
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="fixed inset-0 z-[60] bg-background overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-foreground">Categories</h2>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </div>
        <button onClick={onClose} className="p-1">
          <X className="w-6 h-6 text-foreground" />
        </button>
      </div>

      <div className="px-5 py-4 border-b border-border">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search categories"
            className="pl-9"
          />
        </div>
      </div>

      {/* Category List */}
      <div className="divide-y divide-border">
        {filteredCategories.length === 0 && !loading ? (
          <div className="px-5 py-8 text-center text-muted-foreground">
            {query.trim().length > 0 ? "No categories found" : "No categories available"}
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => toggle(cat.slug, cat.title)}
                className="flex items-center w-full px-5 py-4 gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-muted overflow-hidden shrink-0">
                  <img
                    src={cat.image || fallbackImage}
                    alt={cat.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 text-left">
                  <span className="text-sm font-bold uppercase text-foreground tracking-wide block">
                    {cat.title}
                  </span>
                  {cat.productCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {expanded === cat.title ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </button>

              {expanded === cat.title && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-muted/30"
                >
                  <div className="px-5 py-3">
                    {loadingProducts[cat.slug] ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      </div>
                    ) : categoryProducts[cat.slug] && categoryProducts[cat.slug].length > 0 ? (
                      <div className="space-y-2">
                        {categoryProducts[cat.slug].map((product) => (
                          <Link
                            key={product.id}
                            to={`/product/${product.slug || product.id}`}
                            onClick={onClose}
                            className="flex items-center gap-3 p-2 hover:bg-accent rounded-lg transition-colors"
                          >
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.title}
                                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center flex-shrink-0">
                                <Package className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {product.title}
                              </p>
                              <p className="text-xs font-semibold text-primary">
                                ₹{product.price?.toLocaleString()}
                              </p>
                            </div>
                          </Link>
                        ))}
                        <Link
                          to={`/categories/${cat.slug}`}
                          onClick={onClose}
                          className="block px-4 py-2.5 text-sm text-center text-primary hover:bg-accent rounded-lg transition-colors font-medium"
                        >
                          View All Products →
                        </Link>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-sm text-muted-foreground">No products available</p>
                        <Link
                          to={`/categories/${cat.slug}`}
                          onClick={onClose}
                          className="text-sm text-primary hover:underline mt-1 inline-block"
                        >
                          View All Products
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Extra links */}
      <div className="border-t border-border mt-2 divide-y divide-border">
        {["New Arrivals", "Support"].map((link) => (
          <Link
            key={link}
            to="#"
            onClick={onClose}
            className="block px-5 py-4 text-sm text-foreground hover:text-primary transition-colors"
          >
            {link}
          </Link>
        ))}
      </div>
    </motion.div>
  );
};
