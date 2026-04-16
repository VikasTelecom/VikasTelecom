import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Filter } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ProductCard } from "@/components/product/ProductCard";
import { AmazonMobileProductCard } from "@/components/product/AmazonMobileProductCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";
import { useIsMobile } from "@/hooks/use-mobile";

interface Brand {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  category?: string;
  logo?: string;
  description?: string;
}

const BrandPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const loadBrandAndProducts = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        // First, fetch the brand details by slug
        const brandData = await api.fetchBrand(slug);
        setBrand(brandData);
        
        // Then fetch products using the brand name
        const productsData = await api.fetchProducts({ brand: brandData.name, limit: 100 });
        setProducts(productsData.items);
        
        // Extract unique categories from products
        const categories = [...new Set(productsData.items.map((p: Product) => p.category))];
        setAvailableCategories(categories as string[]);
        setFilteredProducts(productsData.items);
      } catch (error) {
        console.error("Failed to load brand or products:", error);
        setBrand(null);
        setProducts([]);
        setAvailableCategories([]);
      } finally {
        setLoading(false);
      }
    };

    loadBrandAndProducts();
  }, [slug]);

  // Filter products based on selected category
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter((p) => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const getCategoryCount = (category: string) =>
    products.filter((p) => p.category === category).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <CartDrawer />

      <main className="pt-16 lg:pt-20">
        {/* Brand Banner */}
        {brand?.logo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border py-8 mb-8"
          >
            <div className="container-main">
              <div className="flex items-center gap-6">
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-24 w-24 lg:h-32 lg:w-32 object-contain rounded-lg bg-white/50 p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                    {brand.name}
                  </h1>
                  {brand.description && (
                    <p className="text-muted-foreground max-w-2xl">{brand.description}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Breadcrumb */}
        <div className="container-main py-4">
          <nav className="flex items-center gap-1 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground">Brands</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground capitalize">{brand?.name || slug}</span>
          </nav>
        </div>

        {/* Products Grid */}
        <div className="container-main pb-16">
          {availableCategories.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 md:hidden"
            >
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Categories</span>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All ({products.length})</SelectItem>
                  {availableCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace(/-/g, " ")} ({getCategoryCount(category)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          )}

          {availableCategories.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 hidden md:block"
            >
              <div className="bg-card rounded-2xl border border-border/50 p-4 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Categories</span>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:max-w-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ({products.length})</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/-/g, " ")} ({getCategoryCount(category)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-xl font-semibold text-foreground mb-2">
                No products found
              </p>
              <p className="text-muted-foreground mb-6">
                {selectedCategory === "all"
                  ? `${brand?.name} currently has no products available.`
                  : `No products found in ${selectedCategory.replace(/-/g, " ")} from ${brand?.name}.`}
              </p>
              <Link
                to="/"
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5"
            >
              {filteredProducts.map((product, index) => (
                isMobile ? (
                  <AmazonMobileProductCard key={product.id} product={product} />
                ) : (
                  <ProductCard key={product.id} product={product} index={index} />
                )
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BrandPage;
