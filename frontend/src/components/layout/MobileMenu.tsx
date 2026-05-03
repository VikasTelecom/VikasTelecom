import { motion } from "framer-motion";
import { ChevronRight, ChevronDown, ChevronUp, Loader2, User, Package, LogOut, Search } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { useCategories } from "@/contexts/CategoriesContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";

interface MobileMenuProps {
  onClose: () => void;
}

interface Brand {
  id?: string;
  _id?: string;
  name: string;
  slug: string;
  productCount?: number;
}

export const MobileMenu = ({ onClose }: MobileMenuProps) => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { categories: allCategories, loading } = useCategories();
  const categories = allCategories.filter((cat) => cat.status !== "inactive");
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsOpen, setBrandsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [brandQuery, setBrandQuery] = useState("");

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => {
      const name = String(b.name || "").toLowerCase();
      const slug = String(b.slug || "").toLowerCase();
      return name.includes(q) || slug.includes(q);
    });
  }, [brandQuery, brands]);

  const handleScrollToFooter = (e: React.MouseEvent) => {
    e.preventDefault();
    onClose();
    const footerElement = document.getElementById("footer-section");
    if (footerElement) {
      footerElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const loadBrands = async () => {
      try {
        const data = await api.fetchBrands();
        setBrands(data);
      } catch (error) {
        console.error("Failed to load brands:", error);
      } finally {
        setBrandsLoading(false);
      }
    };
    loadBrands();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 lg:hidden"
    >
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="absolute left-0 top-0 bottom-0 w-[300px] bg-background shadow-card-hover overflow-y-auto"
      >
        <div className="p-6 pt-20">
          {isAuthenticated ? (
            <div className="mb-5 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Logged in as</p>
              <p className="text-sm font-semibold truncate mt-1">{user?.name || "User"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              <div className="mt-3 space-y-1">
                <Link
                  to="/profile"
                  onClick={onClose}
                  className="flex items-center justify-between py-2 px-2 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium flex items-center gap-2"><User className="w-4 h-4" /> Profile</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <Link
                  to="/orders"
                  onClick={onClose}
                  className="flex items-center justify-between py-2 px-2 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium flex items-center gap-2"><Package className="w-4 h-4" /> Orders</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    onClose();
                    navigate("/");
                  }}
                  className="w-full flex items-center justify-between py-2 px-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                >
                  <span className="text-sm font-medium flex items-center gap-2"><LogOut className="w-4 h-4" /> Log out</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-5 rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-sm font-semibold">Welcome to VikasTelecom</p>
              <p className="text-xs text-muted-foreground mt-1">Log in to track orders and manage your profile.</p>
              <div className="mt-3 flex gap-2">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md border border-border px-3 py-1.5 text-xs font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          )}

          <nav className="space-y-1">
            <Link
              to="/"
              onClick={onClose}
              className="flex items-center justify-between py-3 px-2 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
            >
              <span className="font-medium">Home</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            {["Best Sellers"].map((item) => (
              <a
                key={item}
                href="#"
                onClick={onClose}
                className="flex items-center justify-between py-3 px-2 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
              >
                <span className="font-medium">{item}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </a>
            ))}
            <Link
              to="/support"
              onClick={onClose}
              className="flex items-center justify-between py-3 px-2 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
            >
              <span className="font-medium">Support</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
            <a
              href="#footer-section"
              onClick={handleScrollToFooter}
              className="flex items-center justify-between py-3 px-2 text-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
            >
              <span className="font-medium">About Us</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </a>
          </nav>

          <div className="mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setBrandsOpen((prev) => !prev)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Brands</h3>
              <div className="flex items-center gap-2">
                {brandsLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {brandsOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {brandsOpen && (
              <>
                <div className="relative mb-3">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={brandQuery}
                    onChange={(e) => setBrandQuery(e.target.value)}
                    placeholder="Search brands"
                    className="pl-9"
                  />
                </div>

                {filteredBrands.length === 0 && !brandsLoading ? (
                  <p className="text-sm text-muted-foreground">
                    {brandQuery.trim().length > 0 ? "No brands found" : "No brands available"}
                  </p>
                ) : (
                  filteredBrands.map((brand) => (
                    <Link
                      key={brand.id || brand._id}
                      to={`/brands/${brand.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between py-3 px-2 hover:bg-accent rounded-lg transition-colors mb-2"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground">{brand.name}</h4>
                        {brand.productCount !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {brand.productCount} product{brand.productCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))
                )}
              </>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setCategoriesOpen((prev) => !prev)}
              className="w-full flex items-center justify-between mb-3"
            >
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Categories</h3>
              <div className="flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {categoriesOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {categoriesOpen && (
              <>
                {categories.length === 0 && !loading ? (
                  <p className="text-sm text-muted-foreground">No categories available</p>
                ) : (
                  categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/categories/${cat.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between py-3 px-2 hover:bg-accent rounded-lg transition-colors mb-2"
                    >
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-foreground">{cat.title}</h4>
                        {cat.productCount !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {cat.productCount} product{cat.productCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
