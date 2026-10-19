import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Package, Search as SearchIcon } from "lucide-react";
import type { Product } from "@/data/products";

interface SearchDropdownProps {
  results: Product[];
  loading: boolean;
  query: string;
  onClose: () => void;
}

export const SearchDropdown = ({ results, loading, query, onClose }: SearchDropdownProps) => {
  if (!query) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute top-full right-0 mt-2 w-[90vw] sm:w-[400px] max-h-[500px] bg-background border border-border rounded-xl shadow-card-hover overflow-hidden z-50"
    >
      <div className="p-3 border-b border-border">
        <p className="text-sm text-muted-foreground">
          {loading ? "Searching..." : `Search results for "${query}"`}
        </p>
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
          <div className="divide-y divide-border">
            {results.map((product) => (
              <Link
                key={product.id}
                to={`/product/${product.slug || product.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-3 hover:bg-muted transition-colors"
              >
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{product.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {product.price > 0 ? (
                      <>
                        <span className="text-sm font-semibold text-primary">
                          ₹{product.price.toLocaleString()}
                        </span>
                        {product.mrp > product.price && (
                          <span className="text-xs text-muted-foreground line-through">
                            ₹{product.mrp.toLocaleString()}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Price unavailable</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <SearchIcon className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground text-center">
              No products found for "{query}"
            </p>
            <p className="text-xs text-muted-foreground/70 text-center mt-1">
              Try searching with different keywords
            </p>
          </div>
        )}
      </div>

      {results.length > 0 && !loading && (
        <div className="p-3 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            Showing {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}
    </motion.div>
  );
};
