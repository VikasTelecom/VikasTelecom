import { useState, useEffect, useRef } from "react";
import { Search, User, ShoppingCart, Menu, X, ChevronDown, Home, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MegaMenu } from "./MegaMenu";
import { BrandsMegaMenu } from "./BrandsMegaMenu";
import { MobileMenu } from "./MobileMenu";
import { SearchDropdown } from "./SearchDropdown";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import type { Product } from "@/data/products";

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Categories", href: "#", hasMega: true, type: "categories" },
  { label: "Brands", href: "#", hasMega: true, type: "brands" },
  { label: "Best Sellers", href: "#best-sellers" },
  { label: "Support", href: "/support" },
  { label: "About Us", href: "#footer-section", isScroll: true },
];

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMegaMenuLocked, setIsMegaMenuLocked] = useState(false);
  const [isBrandsMegaOpen, setIsBrandsMegaOpen] = useState(false);
  const [isBrandsMegaLocked, setIsBrandsMegaLocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { totalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const brandsHoverTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Debounced search effect
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await api.fetchProducts({ q: searchQuery, limit: 10 });
        setSearchResults(data.items as Product[]);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  const handleMouseEnter = () => {
    clearTimeout(hoverTimeoutRef.current);
    if (!isMegaMenuLocked) {
      setIsMegaMenuOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMegaMenuLocked) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsMegaMenuOpen(false);
      }, 150);
    }
  };

  const handleClick = () => {
    if (isMegaMenuLocked) {
      setIsMegaMenuLocked(false);
      setIsMegaMenuOpen(false);
    } else {
      setIsMegaMenuLocked(true);
      setIsMegaMenuOpen(true);
    }
  };

  const handleClose = () => {
    setIsMegaMenuLocked(false);
    setIsMegaMenuOpen(false);
  };

  const handleBrandsMouseEnter = () => {
    clearTimeout(brandsHoverTimeoutRef.current);
    if (!isBrandsMegaLocked) {
      setIsBrandsMegaOpen(true);
    }
  };

  const handleBrandsMouseLeave = () => {
    if (!isBrandsMegaLocked) {
      brandsHoverTimeoutRef.current = setTimeout(() => {
        setIsBrandsMegaOpen(false);
      }, 150);
    }
  };

  const handleBrandsClick = () => {
    if (isBrandsMegaLocked) {
      setIsBrandsMegaLocked(false);
      setIsBrandsMegaOpen(false);
    } else {
      setIsBrandsMegaLocked(true);
      setIsBrandsMegaOpen(true);
    }
  };

  const handleBrandsClose = () => {
    setIsBrandsMegaLocked(false);
    setIsBrandsMegaOpen(false);
  };

  const handleScrollToFooter = (e: React.MouseEvent) => {
    e.preventDefault();
    const footerElement = document.getElementById("footer-section");
    if (footerElement) {
      footerElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-background/95 backdrop-blur-md shadow-header"
            : "bg-background"
        }`}
      >
        <div className="container-main">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <img
                src="/android-chrome-192x192.png"
                alt="VikasTelecom"
                className="h-10 w-10 object-contain"
              />
              <span className="font-bold text-xl tracking-tight text-foreground">
                Vikas<span className="text-primary">Telecom</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link: any) => (
                <div key={link.label} className="relative">
                  {link.hasMega ? (
                    <button
                      onClick={link.type === "brands" ? handleBrandsClick : handleClick}
                      onMouseEnter={link.type === "brands" ? handleBrandsMouseEnter : handleMouseEnter}
                      onMouseLeave={link.type === "brands" ? handleBrandsMouseLeave : handleMouseLeave}
                      className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                    >
                      {link.label}
                      <ChevronDown className={`w-4 h-4 transition-transform ${(link.type === "brands" ? isBrandsMegaOpen : isMegaMenuOpen) ? "rotate-180" : ""}`} />
                    </button>
                  ) : link.isScroll ? (
                    <a
                      href={link.href}
                      onClick={handleScrollToFooter}
                      className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <a
                      href={link.href}
                      className="flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-primary transition-colors py-2"
                    >
                      {link.label}
                    </a>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div ref={searchRef} className="relative">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 200, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        autoFocus
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                
                <AnimatePresence>
                  {isSearchOpen && (searchQuery || isSearching) && (
                    <SearchDropdown
                      results={searchResults}
                      loading={isSearching}
                      query={searchQuery}
                      onClose={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
              
              <button
                onClick={() => {
                  setIsSearchOpen(!isSearchOpen);
                  if (isSearchOpen) {
                    setSearchQuery("");
                    setSearchResults([]);
                  }
                }}
                className="p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Search"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>

              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-1.5 rounded-full hover:bg-muted transition-colors hidden sm:flex items-center justify-center"
                      aria-label="Account menu"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium truncate">{user?.name || "User"}</span>
                        <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {/* Future: add /profile page */}
                    {/* <DropdownMenuItem asChild>
                      <Link to="/profile">Profile</Link>
                    </DropdownMenuItem> */}
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="text-destructive cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  to="/login"
                  className="p-2 rounded-full hover:bg-muted transition-colors hidden sm:flex"
                  aria-label="Account"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              <button
                onClick={() => navigate("/cart")}
                className="p-2 rounded-full hover:bg-muted transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
                {totalItems > 0 && (
                  <motion.span
                    key={totalItems}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full hover:bg-muted transition-colors lg:hidden"
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MegaMenu - backdrop + centered dropdown */}
      <AnimatePresence>
        {isMegaMenuOpen && (
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <MegaMenu onClose={handleClose} />
          </div>
        )}
      </AnimatePresence>

      {/* BrandsMegaMenu */}
      <AnimatePresence>
        {isBrandsMegaOpen && (
          <div
            onMouseEnter={handleBrandsMouseEnter}
            onMouseLeave={handleBrandsMouseLeave}
          >
            <BrandsMegaMenu onClose={handleBrandsClose} />
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isMobileMenuOpen && <MobileMenu onClose={() => setIsMobileMenuOpen(false)} />}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16 lg:h-20" />
    </>
  );
};
