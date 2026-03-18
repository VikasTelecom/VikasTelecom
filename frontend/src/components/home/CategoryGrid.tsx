import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { categories as fallbackCategories } from "@/data/categories";
import { api } from "@/lib/api";
import type { Category } from "@/data/categories";

export const CategoryGrid = () => {
  const [items, setItems] = useState<Category[]>(fallbackCategories);

  useEffect(() => {
    let isMounted = true;

    api.fetchCategories()
      .then((data) => {
        if (isMounted && data.length > 0) {
          setItems(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="py-12 lg:py-16">
      <div className="container-main">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Shop by Category</h2>
          <p className="text-muted-foreground">Find the perfect gadget for your needs</p>
        </div>
        <div className="flex overflow-x-auto pb-6 gap-3 -mx-4 px-4 snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-6 md:gap-4 md:overflow-visible md:pb-0 md:px-0 md:mx-0">
          {items.map((cat, i) => (
            <motion.a
              key={cat.id}
              href={`/category/${cat.slug}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex-shrink-0 w-[40%] md:w-auto snap-start group relative aspect-square rounded-2xl overflow-hidden bg-muted"
            >
              <img
                src={cat.image}
                alt={cat.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-semibold text-background text-sm sm:text-base">{cat.title}</h3>
                <p className="text-background/70 text-xs">{cat.productCount} Products</p>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
};
