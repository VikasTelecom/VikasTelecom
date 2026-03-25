import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import CategoryPage from "./CategoryPage";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";
import { useCategories } from "@/contexts/CategoriesContext";

const CategorySlug = () => {
  const { slug } = useParams();
  const { categories } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const category = useMemo(
    () => categories.find((item) => item.slug === slug),
    [categories, slug]
  );

  useEffect(() => {
    let isMounted = true;

    if (!slug) {
      setProducts([]);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    api.fetchProducts({ category: slug, limit: 200 })
      .then((data) => {
        if (isMounted) {
          setProducts(data.items as Product[]);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProducts([]);
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
  }, [slug]);

  const title = category?.title || (slug ? slug.replace(/-/g, " ") : "Category");
  const description = category?.description || "Browse products in this category.";

  return <CategoryPage title={title} description={description} products={products} loading={loading} />;
};

export default CategorySlug;
