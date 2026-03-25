import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, LayoutGrid, User, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { MobileCategoriesPanel } from "./MobileCategoriesPanel";

const WhatsAppIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

const navItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "WhatsApp", icon: null, customIcon: WhatsAppIcon, path: "#whatsapp" },
  { label: "Categories", icon: LayoutGrid, path: "#categories" },
  { label: "Log In", icon: User, path: "/login" },
  { label: "Cart", icon: ShoppingCart, path: "#cart" },
];

export const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { totalItems, setIsCartOpen } = useCart();
  const [showCategories, setShowCategories] = useState(false);

  const handleClick = (item: typeof navItems[0], e: React.MouseEvent) => {
    if (item.label === "Categories") {
      e.preventDefault();
      setShowCategories(true);
    } else if (item.label === "Cart") {
      e.preventDefault();
      setIsCartOpen(true);
    } else if (item.label === "WhatsApp") {
      e.preventDefault();
      window.open("https://wa.me/919327511512?text=hello", "_blank");
    }
  };

  return (
    <>
      <AnimatePresence>
        {showCategories && (
          <MobileCategoriesPanel onClose={() => setShowCategories(false)} />
        )}
      </AnimatePresence>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-2px_12px_-2px_hsl(var(--foreground)/0.08)] md:hidden">
        <div className="flex items-stretch">
          {navItems.map((item: any, i) => {
            const isActive = item.path.startsWith("/") && pathname === item.path;
            const Icon = item.icon;
            const CustomIcon = item.customIcon;
            const isCart = item.label === "Cart";
            const isWhatsApp = item.label === "WhatsApp";
            const isAction = item.path.startsWith("#");

            return (
              <div key={item.label} className="flex flex-1">
                <Link
                  to={isAction ? pathname : item.path}
                  onClick={(e) => handleClick(item, e)}
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] relative"
                >
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    className="relative"
                  >
                    {isWhatsApp ? (
                      <CustomIcon className="w-5 h-5 transition-colors text-[#25D366]" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 transition-colors ${
                          isActive ? "text-primary" : "text-muted-foreground"
                        }`}
                      />
                    )}
                    {isCart && totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1">
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    )}
                  </motion.div>
                  <span
                    className={`text-[10px] font-medium transition-colors ${
                      isActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
                {i < navItems.length - 1 && (
                  <div className="w-px bg-border/60 my-3" />
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
};
