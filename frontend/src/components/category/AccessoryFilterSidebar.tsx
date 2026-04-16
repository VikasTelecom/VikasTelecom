import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, RotateCcw, X, Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { accessoryTypes, compatibilityOptions } from "@/data/mobileAccessoriesProducts";

export interface AccessoryFilters {
  priceRange: [number, number];
  brands: string[];
  types: string[];
  compatibility: string[];
  minRating: number;
}

interface AccessoryFilterSidebarProps {
  filters: AccessoryFilters;
  onChange: (filters: AccessoryFilters) => void;
  onReset: () => void;
  brands: string[];
  isMobile?: boolean;
  onClose?: () => void;
}

const FilterGroup = ({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border py-4">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between text-sm font-semibold text-foreground">
        {title}
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="pt-3 space-y-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const AccessoryFilterSidebar = ({ filters, onChange, onReset, brands, isMobile, onClose }: AccessoryFilterSidebarProps) => {
  const maxPrice = 5000;

  const applyCustomPrice = (type: "min" | "max", value: string) => {
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return;

    const safeValue = Math.max(0, Math.min(maxPrice, Math.round(parsed)));
    let [min, max] = filters.priceRange;

    if (type === "min") {
      min = safeValue;
      if (min > max) {
        max = min;
      }
    } else {
      max = safeValue;
      if (max < min) {
        min = max;
      }
    }

    onChange({ ...filters, priceRange: [min, max] });
  };

  const toggleArray = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];

  const content = (
    <div className="space-y-0">
      {isMobile && (
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <button onClick={onClose} className="p-1"><X className="w-5 h-5 text-foreground" /></button>
        </div>
      )}

      <FilterGroup title="Price Range">
        <div className="px-1">
          <Slider min={0} max={maxPrice} step={100} value={[filters.priceRange[0], filters.priceRange[1]]}
            onValueChange={(val) => onChange({ ...filters, priceRange: [val[0], val[1]] })} className="mb-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>₹{filters.priceRange[0].toLocaleString()}</span>
            <span>₹{filters.priceRange[1].toLocaleString()}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <input
              type="number"
              min={0}
              max={maxPrice}
              value={filters.priceRange[0]}
              onChange={(event) => applyCustomPrice("min", event.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
              aria-label="Minimum price"
            />
            <input
              type="number"
              min={0}
              max={maxPrice}
              value={filters.priceRange[1]}
              onChange={(event) => applyCustomPrice("max", event.target.value)}
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs text-foreground"
              aria-label="Maximum price"
            />
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Brand">
        {brands.length === 0 ? (
          <p className="text-xs text-muted-foreground">No brands available</p>
        ) : (
          brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
              <Checkbox checked={filters.brands.includes(brand)} onCheckedChange={() => onChange({ ...filters, brands: toggleArray(filters.brands, brand) })} />
              {brand}
            </label>
          ))
        )}
      </FilterGroup>

      <FilterGroup title="Type">
        {accessoryTypes.map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
            <Checkbox checked={filters.types.includes(type)} onCheckedChange={() => onChange({ ...filters, types: toggleArray(filters.types, type) })} />
            {type}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Compatibility">
        {compatibilityOptions.map((c) => (
          <label key={c} className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
            <Checkbox checked={filters.compatibility.includes(c)} onCheckedChange={() => onChange({ ...filters, compatibility: toggleArray(filters.compatibility, c) })} />
            {c}
          </label>
        ))}
      </FilterGroup>

      <FilterGroup title="Rating">
        {[4, 3, 2, 1].map((rating) => (
          <button key={rating} onClick={() => onChange({ ...filters, minRating: filters.minRating === rating ? 0 : rating })}
            className={`flex items-center gap-1 text-sm px-2 py-1 rounded-md transition-colors w-full ${filters.minRating === rating ? "bg-accent text-accent-foreground" : "text-foreground hover:bg-muted"}`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`w-3.5 h-3.5 ${i < rating ? "fill-primary text-primary" : "text-border"}`} />
            ))}
            <span className="ml-1">& Up</span>
          </button>
        ))}
      </FilterGroup>

      <div className="pt-4">
        <button onClick={onReset} className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary-hover transition-colors">
          <RotateCcw className="w-4 h-4" /> Reset All Filters
        </button>
      </div>

      {isMobile && (
        <div className="pt-4">
          <button onClick={onClose} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm hover:bg-primary-hover transition-colors">
            Apply Filters
          </button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-0 z-50 bg-background overflow-y-auto p-5">
        {content}
      </motion.div>
    );
  }

  return (
    <aside className="sticky top-24 w-64 shrink-0 hidden lg:block">
      <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-card">
        <h2 className="text-base font-semibold text-foreground mb-2">Filters</h2>
        {content}
      </div>
    </aside>
  );
};
