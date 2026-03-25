import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";

export const FeaturedProducts = () => {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    api.fetchProducts({ limit: 8, sort: "rating:desc" })
      .then((data) => {
        if (isMounted && data.items.length > 0) {
          setItems(data.items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setItems([]);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return <FeaturedProductsSkeleton />;
  }

  return (
    <section className="py-12 lg:py-16 bg-surface">
      <div className="container-main">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Featured Products</h2>
          <p className="text-muted-foreground">Handpicked deals just for you</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {items.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeaturedProductsSkeleton = () => {
  return (
    <section className="py-12 lg:py-16 bg-surface">
      <div className="container-main">
        <div className="text-center mb-10">
          <Skeleton className="mx-auto mb-3 h-8 w-56" />
          <Skeleton className="mx-auto h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border/50 overflow-hidden bg-card">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
