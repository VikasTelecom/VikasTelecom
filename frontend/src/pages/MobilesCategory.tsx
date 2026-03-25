import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { SlidersHorizontal, ChevronRight, PackageSearch, Cpu, HardDrive } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { ProductCard } from "@/components/product/ProductCard";
import { AmazonMobileProductCard } from "@/components/product/AmazonMobileProductCard";
import { MobileFilterSidebar, MobileFilters } from "@/components/category/MobileFilterSidebar";
import { mobileProducts, MobileProduct } from "@/data/mobileProducts";
import { api } from "@/lib/api";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const PRODUCTS_PER_PAGE = 8;

const defaultFilters: MobileFilters = {
  priceRange: [0, 50000],
  brands: [],
  ram: [],
  storage: [],
  has5G: null,
  minBattery: "",
  minRating: 0,
};

type SortOption = "featured" | "price-asc" | "price-desc" | "best-selling" | "newest";

const MobilesCategory = () => {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<MobileProduct[]>(mobileProducts);
  const [filters, setFilters] = useState<MobileFilters>(defaultFilters);
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const brands = useMemo(() => {
    const unique = new Set(items.map((p) => p.brand).filter(Boolean));
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [items]);

  useEffect(() => {
    api.fetchProducts({ category: "mobiles", limit: 200 })
      .then((data) => {
        if (data.items.length === 0) return;
        const mapped = data.items.map((product) => ({
          ...product,
          brand: product.brand || "",
          ram: product.ram || "",
          storage: product.storage || "",
          battery: product.battery || "",
          has5G: product.has5G || false,
          emi: product.emi,
        })) as MobileProduct[];
        setItems(mapped);
      })
      .catch(() => {});
  }, []);

  const filteredProducts = useMemo(() => {
    let result: MobileProduct[] = [...items];

    result = result.filter((p) => p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]);
    if (filters.brands.length > 0) result = result.filter((p) => filters.brands.includes(p.brand));
    if (filters.ram.length > 0) result = result.filter((p) => filters.ram.includes(p.ram));
    if (filters.storage.length > 0) result = result.filter((p) => filters.storage.includes(p.storage));
    if (filters.has5G === true) result = result.filter((p) => p.has5G);
    if (filters.minBattery) {
      result = result.filter((p) => {
        const bat = parseInt(p.battery);
        if (filters.minBattery === "5000+ mAh") return bat >= 5000;
        if (filters.minBattery === "4500-5000 mAh") return bat >= 4500 && bat < 5000;
        if (filters.minBattery === "4000-4500 mAh") return bat >= 4000 && bat < 4500;
        return true;
      });
    }
    if (filters.minRating > 0) result = result.filter((p) => p.rating >= filters.minRating);

    switch (sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "best-selling": result.sort((a, b) => b.reviewCount - a.reviewCount); break;
      case "newest": result.sort((a, b) => (b.badge === "new" ? 1 : 0) - (a.badge === "new" ? 1 : 0)); break;
    }
    return result;
  }, [filters, sortBy, items]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);

  const handleFilterChange = (f: MobileFilters) => { setFilters(f); setCurrentPage(1); };
  const handleReset = () => { setFilters(defaultFilters); setCurrentPage(1); };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />
      <main className="container-main py-6">
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-primary font-medium">Mobiles</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">Mobiles</h1>
          <p className="text-muted-foreground">Explore the latest smartphones from top brands with 5G, powerful cameras and long battery life.</p>
        </div>

        <div className="flex items-center gap-3 mb-6 lg:hidden">
          <button onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <div className="flex-1">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="best-selling">Best Selling</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-8">
          <MobileFilterSidebar filters={filters} onChange={handleFilterChange} onReset={handleReset} brands={brands} />
          <AnimatePresence>
            {showMobileFilters && (
              <MobileFilterSidebar filters={filters} onChange={handleFilterChange} onReset={handleReset} brands={brands} isMobile onClose={() => setShowMobileFilters(false)} />
            )}
          </AnimatePresence>

          <div className="flex-1 min-w-0">
            <div className="hidden lg:flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filteredProducts.length}</span> mobiles
              </p>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                <SelectTrigger className="w-48 rounded-xl"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="best-selling">Best Selling</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paginatedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                {paginatedProducts.map((product, i) => (
                  <div key={product.id} className="relative">
                    {isMobile ? (
                      <AmazonMobileProductCard product={product} />
                    ) : (
                      <>
                        <ProductCard product={product} index={i} />
                        {/* RAM + Storage badge */}
                        <div className="absolute bottom-[7.5rem] left-3 right-3 flex gap-1.5 pointer-events-none">
                          <span className="flex items-center gap-1 bg-background/90 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-md border border-border/50">
                            <Cpu className="w-3 h-3" />{product.ram}
                          </span>
                          <span className="flex items-center gap-1 bg-background/90 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-md border border-border/50">
                            <HardDrive className="w-3 h-3" />{product.storage}
                          </span>
                        </div>
                        {product.emi && (
                          <p className="text-xs text-muted-foreground mt-1 px-4">EMI from {product.emi}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center">
                <PackageSearch className="w-16 h-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-1">No mobiles match your filters</h3>
                <p className="text-sm text-muted-foreground mb-4">Try adjusting or resetting your filters.</p>
                <button onClick={handleReset}
                  className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors">
                  Reset Filters
                </button>
              </motion.div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40">
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${currentPage === i + 1 ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted border border-border"}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-40">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MobilesCategory;
