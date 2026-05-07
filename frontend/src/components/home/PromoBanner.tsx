import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface Brand {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  image?: string;
}

const MotionLink = motion(Link);

const FALLBACK_BRAND_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" rx="32" fill="#f4f4f5"/><rect x="56" y="56" width="288" height="288" rx="28" fill="#e4e4e7"/><path d="M104 274l66-76 44 48 30-28 56 56H104z" fill="#c4c4c8"/><circle cx="144" cy="154" r="24" fill="#d4d4d8"/></svg>'
)}`;

export const PromoBanner = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    api.fetchBrands()
      .then((items) => {
        if (!active) return;
        setBrands(items);
      })
      .catch((error) => {
        console.error("Failed to load brands:", error);
        if (!active) return;
        setBrands([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredBrands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => {
      const name = String(b.name || "").toLowerCase();
      const slug = String(b.slug || "").toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [brands, query]);

  if (loading) {
    return <BrandGridSkeleton />;
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container-main">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Shop by Brand</h2>
          <p className="text-muted-foreground">Find products from your favorite brands</p>

          <div className="relative max-w-sm mx-auto mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brands"
              className="pl-9"
            />
          </div>
        </div>

        {filteredBrands.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            {query.trim().length > 0 ? "No brands found" : "No brands available"}
          </div>
        ) : (
          <div className="grid grid-flow-col grid-rows-2 auto-cols-[minmax(76px,20vw)] overflow-x-auto pb-6 gap-2 -mx-4 px-3 snap-x snap-mandatory md:grid-flow-row md:grid-rows-none md:auto-cols-auto md:grid-cols-4 lg:grid-cols-10 md:gap-3 md:overflow-visible md:pb-0 md:px-0 md:mx-0">
            {filteredBrands.map((brand, i) => (
              <MotionLink
                key={brand.id || brand._id || brand.slug}
                to={`/brands/${brand.slug}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="snap-start group block rounded-2xl bg-muted overflow-hidden"
              >
                <div className="relative aspect-square overflow-hidden bg-muted flex items-center justify-center p-3">
                  <img
                    src={brand.image || FALLBACK_BRAND_IMAGE}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain"
                    loading={i < 4 ? "eager" : "lazy"}
                    fetchPriority={i < 4 ? "high" : "auto"}
                    decoding="async"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_BRAND_IMAGE;
                    }}
                  />
                </div>
                <div className="px-2 py-2.5 text-center bg-muted">
                  <h3 className="font-normal sm:font-semibold text-foreground text-[11px] sm:text-xs leading-tight">{brand.name}</h3>
                </div>
              </MotionLink>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const BrandGridSkeleton = () => {
  return (
    <section className="py-12 lg:py-16">
      <div className="container-main">
        <div className="text-center mb-10">
          <Skeleton className="mx-auto mb-3 h-8 w-56" />
          <Skeleton className="mx-auto h-4 w-72" />
          <Skeleton className="mx-auto mt-4 h-10 w-[320px] max-w-full" />
        </div>
        <div className="grid grid-flow-col grid-rows-2 auto-cols-[minmax(76px,20vw)] overflow-x-auto pb-6 gap-2 -mx-4 px-3 snap-x snap-mandatory md:grid-flow-row md:grid-rows-none md:auto-cols-auto md:grid-cols-4 lg:grid-cols-10 md:gap-3 md:overflow-visible md:pb-0 md:px-0 md:mx-0">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="snap-start aspect-square rounded-2xl overflow-hidden bg-muted"
            >
              <Skeleton className="h-full w-full rounded-none" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
