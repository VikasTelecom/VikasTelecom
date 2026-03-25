import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategories } from "@/contexts/CategoriesContext";

const MotionLink = motion(Link);

const FALLBACK_CATEGORY_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" rx="32" fill="#f4f4f5"/><rect x="56" y="56" width="288" height="288" rx="28" fill="#e4e4e7"/><path d="M104 274l66-76 44 48 30-28 56 56H104z" fill="#c4c4c8"/><circle cx="144" cy="154" r="24" fill="#d4d4d8"/></svg>'
)}`;

export const CategoryGrid = () => {
  const { categories, loading } = useCategories();
  const items = categories.filter((cat) => cat.status !== "inactive");

  if (loading) {
    return <CategoryGridSkeleton />;
  }

  return (
    <section className="py-12 lg:py-16">
      <div className="container-main">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Shop by Category</h2>
          <p className="text-muted-foreground">Find the perfect gadget for your needs</p>
        </div>
        <div className="grid grid-flow-col grid-rows-2 auto-cols-[minmax(96px,30vw)] overflow-x-auto pb-6 gap-3 -mx-4 px-4 snap-x snap-mandatory md:grid-flow-row md:grid-rows-none md:auto-cols-auto md:grid-cols-3 lg:grid-cols-8 md:gap-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0">
          {items.map((cat, i) => (
            <MotionLink
              key={cat.id}
              to={`/categories/${cat.slug}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="snap-start group relative aspect-square rounded-2xl overflow-hidden bg-muted"
            >
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
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-semibold text-background text-sm sm:text-base">{cat.title}</h3>
                <p className="text-background/70 text-xs">{cat.productCount} Products</p>
              </div>
            </MotionLink>
          ))}
        </div>
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
        </div>
        <div className="grid grid-flow-col grid-rows-2 auto-cols-[minmax(96px,30vw)] overflow-x-auto pb-6 gap-3 -mx-4 px-4 snap-x snap-mandatory md:grid-flow-row md:grid-rows-none md:auto-cols-auto md:grid-cols-3 lg:grid-cols-8 md:gap-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0">
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
