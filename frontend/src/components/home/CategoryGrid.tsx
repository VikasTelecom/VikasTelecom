import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/contexts/CategoriesContext";

const MotionLink = motion(Link);

const FALLBACK_CATEGORY_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" rx="32" fill="#f4f4f5"/><rect x="56" y="56" width="288" height="288" rx="28" fill="#e4e4e7"/><path d="M104 274l66-76 44 48 30-28 56 56H104z" fill="#c4c4c8"/><circle cx="144" cy="154" r="24" fill="#d4d4d8"/></svg>'
)}`;

export const CategoryGrid = () => {
  const { categories, loading } = useCategories();
  const items = categories.filter((cat) => cat.status !== "inactive");
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((cat) => {
      const title = String(cat.title || "").toLowerCase();
      const slug = String(cat.slug || "").toLowerCase();
      return title.includes(q) || slug.includes(q);
    });
  }, [items, query]);

  if (loading) {
    return <CategoryGridSkeleton />;
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container-main">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Shop by Category</h2>
          <p className="text-muted-foreground">Find the perfect gadget for your needs</p>

          <div className="relative max-w-sm mx-auto mt-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search categories"
              className="pl-9"
            />
          </div>
        </div>
        {filteredItems.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-10">
            No categories found
          </div>
        ) : (
          <div className="grid grid-flow-col grid-rows-2 auto-cols-[minmax(76px,20vw)] overflow-x-auto pb-6 gap-2 -mx-4 px-3 snap-x snap-mandatory md:grid-flow-row md:grid-rows-none md:auto-cols-auto md:grid-cols-4 lg:grid-cols-10 md:gap-3 md:overflow-visible md:pb-0 md:px-0 md:mx-0">
          {filteredItems.map((cat, i) => (
            <MotionLink
              key={cat.id}
              to={`/categories/${cat.slug}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="snap-start group block rounded-2xl bg-muted overflow-hidden"
            >
              <div className="relative aspect-square overflow-hidden bg-muted">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading={i < 4 ? "eager" : "lazy"}
                  fetchPriority={i < 4 ? "high" : "auto"}
                  decoding="async"
                  onError={(event) => {
                    event.currentTarget.src = FALLBACK_CATEGORY_IMAGE;
                  }}
                />
              </div>
              <div className="px-2 py-2.5 text-center bg-muted">
                <h3 className="font-normal sm:font-semibold text-foreground text-[11px] sm:text-xs leading-tight">{cat.title}</h3>
              </div>
            </MotionLink>
          ))}
        </div>
        )}
      </div>
    </section>
  );
};

const CategoryGridSkeleton = () => {
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
