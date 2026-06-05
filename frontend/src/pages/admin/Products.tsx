import { useMemo, useState, useEffect, useCallback } from "react";
import { Plus, Search, Pencil, Trash2, X, ImageIcon, Package, Tag, BarChart3, ListChecks, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProduct } from "@/data/adminMockData";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useCategories } from "@/contexts/CategoriesContext";

const normalizeQuickList = (value: string): string[] => {
  const items = String(value || "")
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  return [...new Set(items)];
};

const toSkuToken = (value: string): string => {
  const token = String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
  return token;
};

const toSkuPrefix = (value: string): string => {
  const normalized = String(value || "")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || "PRODUCT";
};

type CategoryOption = { id: string; name: string; slug: string };

const statusBadge: Record<string, string> = {
  active: "bg-green-100 text-green-700 border border-green-200",
  draft: "bg-yellow-100 text-yellow-700 border border-yellow-200",
  out_of_stock: "bg-red-100 text-red-700 border border-red-200",
};

const badgeColor: Record<string, string> = {
  sale: "bg-orange-100 text-orange-700",
  new: "bg-blue-100 text-blue-700",
  bestseller: "bg-purple-100 text-purple-700",
};

const EVMZONE_IMAGE_BASE_URL = "https://evmzone.com";
const FALLBACK_PRODUCT_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">Image unavailable</text></svg>`,
)}`;

const getSafeProductImageUrl = (image?: string) => {
  if (!image) return FALLBACK_PRODUCT_IMAGE;

  const value = image.trim();
  if (!value) return FALLBACK_PRODUCT_IMAGE;

  if (value.startsWith("https://")) return value;
  if (value.startsWith("http://")) return value.replace(/^http:\/\//i, "https://");
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `${EVMZONE_IMAGE_BASE_URL}${value}`;

  return `${EVMZONE_IMAGE_BASE_URL}/${value}`;
};

type Spec = { feature: string; value: string };
type VariantForm = {
  sku: string;
  name: string;
  image?: string;
  hoverImage?: string;
  gallery?: string[];
  price?: string;
  mrp?: string;
  stock?: string;
  color: string;
  colorMode?: "preset" | "custom";
  storage: string;
  ram: string;
  size: string;
  specifications?: Spec[];
};

type VariantStringKey = Exclude<keyof VariantForm, "gallery">;

type AdminProductView = AdminProduct & {
  generalName?: string;
  brand?: string;
  images?: string[];
  variants?: VariantForm[];
};

const mapVariantToForm = (variant: any): VariantForm => {
  const images = Array.isArray(variant.images) ? variant.images.filter(Boolean) : [];
  const [mainImage = "", hoverImage = "", ...gallery] = images;
  const color = variant.attributes?.color || "";

  return {
    sku: variant.sku || "",
    name: variant.name || "",
    image: variant.image || mainImage,
    hoverImage: variant.hoverImage || hoverImage,
    gallery,
    price: variant.price?.toString() || "",
    mrp: variant.mrp?.toString() || "",
    stock: variant.stock?.toString() || "",
    color,
    colorMode: color && !isPresetVariantColor(color) ? "custom" : "preset",
    storage: variant.attributes?.storage || "",
    ram: variant.attributes?.ram || "",
    size: variant.attributes?.size || "",
    specifications: variant.specifications || [],
  };
};

interface ProductForm {
  name: string;
  generalName: string;
  category: string;
  brand: string;
  description: string;
  image: string;
  hoverImage: string;
  gallery: string[];
  price: string;
  mrp: string;
  discount: string;
  stock: string;
  status: "active" | "draft" | "out_of_stock";
  badge: string;
  specifications: Spec[];
  variants: VariantForm[];
}

const defaultForm: ProductForm = {
  name: "",
  generalName: "",
  category: "",
  brand: "no-brand",
  description: "",
  image: "",
  hoverImage: "",
  gallery: [],
  price: "",
  mrp: "",
  discount: "",
  stock: "",
  status: "active",
  badge: "none",
  specifications: [{ feature: "", value: "" }],
  variants: [],
};

function syncVariant1Images(formState: ProductForm, updates: Partial<Pick<ProductForm, "image" | "hoverImage">>): ProductForm {
  if (formState.variants.length === 0) {
    return { ...formState, ...updates };
  }

  const nextImage = updates.image ?? formState.image;
  const nextHoverImage = updates.hoverImage ?? formState.hoverImage;

  return {
    ...formState,
    ...updates,
    variants: formState.variants.map((variant, idx) =>
      idx === 0
        ? {
            ...variant,
            image: nextImage,
            hoverImage: nextHoverImage,
          }
        : variant,
    ),
  };
}

function calcDiscount(price: string, mrp: string): string {
  const p = parseFloat(price);
  const m = parseFloat(mrp);
  if (p > 0 && m > 0 && m > p) return Math.round(((m - p) / m) * 100).toString();
  return "";
}

const PRESET_VARIANT_COLORS = [
  "black",
  "white",
  "gray",
  "grey",
  "silver",
  "gold",
  "rose gold",
  "rosegold",
  "space gray",
  "space grey",
  "spacegray",
  "midnight",
  "starlight",
  "graphite",
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "titanium",
  "bronze",
  "copper",
  "champagne",
] as const;

const CUSTOM_COLOR_VALUE = "__custom__";

function normalizeColorToken(value: string): string {
  return String(value || "").trim().toLowerCase();
}

function isPresetVariantColor(value: string): boolean {
  const normalized = normalizeColorToken(value);
  return PRESET_VARIANT_COLORS.includes(normalized as (typeof PRESET_VARIANT_COLORS)[number]);
}

// Get color hex codes for preview
function getColorHex(color: string): string {
  const raw = String(color || "").trim();
  if (!raw) return "#808080";

  // Allow explicit CSS color formats for custom selections
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(raw)) return raw;
  if (/^(rgb|rgba|hsl|hsla)\(/i.test(raw)) return raw;

  const colorMap: Record<string, string> = {
    // Basic colors
    'black': '#1a1a1a',
    'white': '#FFFFFF',
    'gray': '#808080',
    'grey': '#808080',
    
    // Metallic colors (common in phones)
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'rose gold': '#E0BFB8',
    'rosegold': '#E0BFB8',
    'space gray': '#535355',
    'space grey': '#535355',
    'spacegray': '#535355',
    'midnight': '#232733',
    'starlight': '#FAF6F3',
    'graphite': '#41424C',
    
    // Primary colors
    'red': '#FF0000',
    'blue': '#0071E3',
    'green': '#4CD964',
    'yellow': '#FFD700',
    'orange': '#FF8C42',
    'purple': '#AF52DE',
    'pink': '#FF2D55',
    
    // Extended colors
    'navy': '#000080',
    'navy blue': '#000080',
    'sky blue': '#87CEEB',
    'light blue': '#ADD8E6',
    'dark blue': '#00008B',
    'coral': '#FF7F50',
    'mint': '#98FF98',
    'mint green': '#98FF98',
    'lavender': '#E6E6FA',
    'violet': '#8F00FF',
    'burgundy': '#800020',
    'maroon': '#800000',
    'brown': '#964B00',
    'beige': '#F5F5DC',
    'cream': '#FFFDD0',
    'titanium': '#878681',
    'bronze': '#CD7F32',
    'copper': '#B87333',
    'champagne': '#F7E7CE',
  };
  
  const normalizedColor = raw.toLowerCase().trim();
  return colorMap[normalizedColor] || normalizedColor || '#808080';
}

export default function Products() {
  const PRODUCTS_PER_PAGE = 50;
  const { refreshCategories } = useCategories();
  const [products, setProducts] = useState<AdminProductView[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string; slug: string; categories: string[] }[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProductView | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [activeSection, setActiveSection] = useState(0);
  const [quickStorageList, setQuickStorageList] = useState("");
  const [quickStorageCloneIndex, setQuickStorageCloneIndex] = useState("0");

  // Auto-calculate discount when price or mrp changes
  useEffect(() => {
    const disc = calcDiscount(form.price, form.mrp);
    if (disc) setForm((f) => ({ ...f, discount: disc }));
  }, [form.price, form.mrp]);

  const categoryLabel = useMemo(() => {
    const map = new Map(categories.map((c) => [c.slug, c.name]));
    return (slug: string) => map.get(slug) || slug;
  }, [categories]);

  const toAdminProductView = (product: any): AdminProductView => ({
    id: product.id,
    name: product.title,
    generalName: (product as { generalName?: string }).generalName || "",
    brand: product.brand,
    image: product.image,
    hoverImage: product.hoverImage,
    images: product.images || [],
    variants: (product.variants || []).map(mapVariantToForm),
    category: product.category,
    description: product.description || "",
    price: product.price,
    mrp: product.mrp,
    discount: product.discount,
    stock: product.stock || 0,
    status: product.status || "active",
    badge: product.badge,
    specifications: product.specifications || [],
  });

  const loadProducts = useCallback(async (pageToLoad: number, keyword: string, category: string) => {
    try {
      setIsLoadingProducts(true);
      const productData = await api.adminListProducts({
        page: pageToLoad,
        limit: PRODUCTS_PER_PAGE,
        sort: "-createdAt",
        q: keyword.trim() || undefined,
        category: category === "All" ? undefined : category,
      });

      const mapped = productData.items.map((product) => toAdminProductView(product));
      setProducts(mapped);
      setTotalProducts(productData.total || 0);
      setTotalPages(Math.max(productData.pages || 1, 1));
    } catch (error) {
      toast({ title: "Failed to load products", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [categoryData, brandData] = await Promise.all([
          api.adminListCategories(),
          api.adminListBrands(),
        ]);

        setCategories(categoryData.map((c) => ({ id: c.id, name: c.title, slug: c.slug })));
        setBrands(brandData.map((b: any) => ({
          id: b._id || b.id,
          name: b.name,
          slug: b.slug,
          categories: b.categories || (b.category ? [b.category] : []),
        })));
      } catch (error) {
        toast({ title: "Failed to load products", description: (error as Error).message, variant: "destructive" });
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadProducts(currentPage, search, catFilter);
    }, 250);

    return () => clearTimeout(timer);
  }, [currentPage, search, catFilter, loadProducts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, catFilter]);

  // Filter brands based on selected category
  useEffect(() => {
    if (form.category) {
      const categoryBrands = brands.filter((b) => b.categories.includes(form.category));
      setFilteredBrands(categoryBrands);
      // If current brand doesn't belong to new category, reset it
      if (form.brand && form.brand !== "no-brand" && !categoryBrands.some(b => b.name === form.brand)) {
        setForm(prev => ({ ...prev, brand: "no-brand" }));
      }
    } else {
      setFilteredBrands([]);
    }
  }, [form.category, brands]);

  const openAdd = () => {
    if (categories.length === 0) {
      toast({ 
        title: "Please wait", 
        description: "Loading categories...", 
        variant: "destructive" 
      });
      return;
    }
    
    setEditingProduct(null);
    setActiveSection(0);
    const initialCategory = categories[0]?.slug || "";
    
    setForm({ 
      ...defaultForm, 
      category: initialCategory,
      brand: "no-brand"
    });

    setQuickStorageList("");
    setQuickStorageCloneIndex("0");
    
    setDialogOpen(true);
  };

  const openEdit = (p: AdminProductView) => {
    const galleryImages = (p.images || []).filter((img) => img && img !== p.image && img !== p.hoverImage);
    setEditingProduct(p);
    setForm({
      name: p.name,
      generalName: p.generalName || "",
      category: p.category,
      brand: (p as any).brand || "no-brand",
      description: p.description,
      image: p.image,
      hoverImage: p.hoverImage || "",
      gallery: galleryImages,
      price: p.price.toString(),
      mrp: p.mrp.toString(),
      discount: p.discount.toString(),
      stock: p.stock.toString(),
      status: p.status,
      badge: p.badge || "none",
      specifications: p.specifications.length > 0 ? p.specifications : [{ feature: "", value: "" }],
      variants: p.variants || [],
    });

    setQuickStorageList("");
    setQuickStorageCloneIndex("0");
    setActiveSection(0);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.mrp) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const cleanSpecs = form.specifications.filter((s) => s.feature.trim() && s.value.trim());
    const gallery = form.gallery.map((entry) => entry.trim()).filter(Boolean);
    const cleanVariants = form.variants
      .filter((variant) => variant.sku.trim())
      .map((variant, variantIndex) => {
        // Variant-specific gallery
        const variantGallery = (variant.gallery || []).map((entry) => entry.trim()).filter(Boolean);
        
        const isVariantOne = variantIndex === 0;
        // Use variant images if provided, otherwise use product-level images
        const variantMainImage = isVariantOne
          ? (form.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop")
          : (variant.image || form.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop");
        const variantHoverImage = isVariantOne ? form.hoverImage : (variant.hoverImage || form.hoverImage);
        const variantAllImages = [variantMainImage, variantHoverImage, ...(variantGallery.length > 0 ? variantGallery : gallery)].filter(Boolean);
        
        // Use variant pricing if provided, otherwise use product-level pricing
        const variantPrice = variant.price ? Number(variant.price) : Number(form.price);
        const variantMrp = variant.mrp ? Number(variant.mrp) : Number(form.mrp);
        const variantDiscount = Math.round(((variantMrp - variantPrice) / variantMrp) * 100);
        const variantStock = variant.stock ? Number(variant.stock) : Number(form.stock);
        
        // Use variant specifications if provided, otherwise use product-level specs
        const variantSpecs = variant.specifications && variant.specifications.length > 0
          ? variant.specifications.filter((s) => s.feature.trim() && s.value.trim())
          : cleanSpecs;

        return {
          sku: variant.sku,
          name: variant.name || undefined,
          image: variantMainImage,
          hoverImage: variantHoverImage || undefined,
          images: variantAllImages,
          price: variantPrice,
          mrp: variantMrp,
          discount: variantDiscount || undefined,
          stock: variantStock,
          specifications: variantSpecs,
          attributes: {
            color: variant.color || undefined,
            storage: variant.storage || undefined,
            ram: variant.ram || undefined,
            size: variant.size || undefined,
          },
        };
      });
    
    // Combine all images: main image, hover image, and gallery images
    const mainImage = form.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";
    const allImages = [mainImage, form.hoverImage, ...gallery].filter(Boolean);
    
    const payload = {
      title: form.name.trim(),
      generalName: form.generalName.trim(),
      category: form.category,
      brand: form.brand && form.brand !== "no-brand" ? form.brand : undefined,
      description: form.description,
      image: mainImage,
      hoverImage: form.hoverImage || undefined,
      images: allImages,
      price: Number(form.price),
      mrp: Number(form.mrp),
      discount: Number(form.discount) || Math.round(((Number(form.mrp) - Number(form.price)) / Number(form.mrp)) * 100),
      stock: Number(form.stock),
      status: form.status,
      badge: form.badge !== "none" ? form.badge : undefined,
      specifications: cleanSpecs,
      variants: cleanVariants,
    };

    try {
      if (editingProduct) {
        const updated = await api.adminUpdateProduct(editingProduct.id, payload);
        setProducts((prev) => prev.map((p) => p.id === editingProduct.id ? toAdminProductView(updated) : p));
        toast({ title: "Product updated successfully" });
        loadProducts(currentPage, search, catFilter);
        refreshCategories();
      } else {
        await api.adminCreateProduct(payload);
        setCurrentPage(1);
        loadProducts(1, search, catFilter);
        toast({ title: "Product added successfully" });
        refreshCategories();
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to save product", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await api.adminDeleteProduct(deletingId);
        loadProducts(currentPage, search, catFilter);
        toast({ title: "Product deleted" });
        // Refresh categories in case product count changed
        refreshCategories();
      } catch (error) {
        toast({ title: "Failed to delete product", description: (error as Error).message, variant: "destructive" });
      } finally {
        setDeleteDialogOpen(false);
        setDeletingId(null);
      }
    }
  };

  const handleDuplicate = async (product: AdminProductView) => {
    try {
      setDuplicatingId(product.id);

      const sourceSpecs = (product.specifications || [])
        .filter((s) => s.feature.trim() && s.value.trim())
        .map((s) => ({ feature: s.feature.trim(), value: s.value.trim() }));

      const gallery = (product.images || [])
        .map((entry) => entry.trim())
        .filter((entry) => entry && entry !== product.image && entry !== product.hoverImage);

      const mainImage = product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop";
      const allImages = [mainImage, product.hoverImage, ...gallery].filter(Boolean) as string[];

      const duplicateVariants = (product.variants || [])
        .filter((variant) => variant.sku.trim())
        .map((variant) => {
          const variantGallery = (variant.gallery || []).map((entry) => entry.trim()).filter(Boolean);

          const variantMainImage = variant.image || mainImage;
          const variantHoverImage = variant.hoverImage || product.hoverImage;
          const variantAllImages = [variantMainImage, variantHoverImage, ...(variantGallery.length > 0 ? variantGallery : gallery)].filter(Boolean);

          const variantPrice = variant.price ? Number(variant.price) : Number(product.price);
          const variantMrp = variant.mrp ? Number(variant.mrp) : Number(product.mrp);
          const variantDiscount = variantMrp > variantPrice
            ? Math.round(((variantMrp - variantPrice) / variantMrp) * 100)
            : 0;

          const variantSpecs = variant.specifications && variant.specifications.length > 0
            ? variant.specifications.filter((s) => s.feature.trim() && s.value.trim())
            : sourceSpecs;

          return {
            sku: variant.sku,
            name: variant.name || undefined,
            image: variantMainImage,
            hoverImage: variantHoverImage || undefined,
            images: variantAllImages,
            price: variantPrice,
            mrp: variantMrp,
            discount: variantDiscount || undefined,
            stock: variant.stock ? Number(variant.stock) : Number(product.stock),
            specifications: variantSpecs,
            attributes: {
              color: variant.color || undefined,
              storage: variant.storage || undefined,
              ram: variant.ram || undefined,
              size: variant.size || undefined,
            },
          };
        });

      const duplicateTitle = `${product.name.trim()} (Copy)`;
      const payload = {
        title: duplicateTitle,
        generalName: (product.generalName || "").trim(),
        category: product.category,
        brand: product.brand || undefined,
        description: product.description,
        image: mainImage,
        hoverImage: product.hoverImage || undefined,
        images: allImages,
        price: Number(product.price),
        mrp: Number(product.mrp),
        discount: Number(product.discount) || (Number(product.mrp) > Number(product.price)
          ? Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)
          : 0),
        stock: Number(product.stock),
        status: product.status,
        badge: product.badge || undefined,
        specifications: sourceSpecs,
        variants: duplicateVariants,
      };

      await api.adminCreateProduct(payload);
      setCurrentPage(1);
      loadProducts(1, search, catFilter);
      toast({ title: "Product duplicated successfully" });
      refreshCategories();
    } catch (error) {
      toast({ title: "Failed to duplicate product", description: (error as Error).message, variant: "destructive" });
    } finally {
      setDuplicatingId(null);
    }
  };

  const addSpec = () => setForm((f) => ({ ...f, specifications: [...f.specifications, { feature: "", value: "" }] }));
  const removeSpec = (i: number) => setForm((f) => ({ ...f, specifications: f.specifications.filter((_, idx) => idx !== i) }));
  const updateSpec = (i: number, key: "feature" | "value", val: string) =>
    setForm((f) => ({ ...f, specifications: f.specifications.map((s, idx) => idx === i ? { ...s, [key]: val } : s) }));

  const addVariant = () => setForm((f) => ({
    ...f,
    variants: [
      ...f.variants,
      {
        sku: "",
        name: "",
        color: "",
        colorMode: "preset",
        storage: "",
        ram: "",
        size: "",
        image: "",
        hoverImage: "",
        gallery: [],
        price: "",
        mrp: "",
        stock: "",
        specifications: [],
      },
    ],
  }));
  const removeVariant = (i: number) => setForm((f) => ({
    ...f,
    variants: f.variants.filter((_, idx) => idx !== i),
  }));
  const updateVariant = (i: number, key: VariantStringKey, value: string) => setForm((f) => ({
    ...f,
    variants: f.variants.map((variant, idx) => idx === i ? { ...variant, [key]: value } : variant),
  }));

  const addVariantGalleryImage = (variantIndex: number) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((variant, idx) =>
        idx === variantIndex
          ? { ...variant, gallery: [...(variant.gallery || []), ""] }
          : variant,
      ),
    }));
  };

  const removeVariantGalleryImage = (variantIndex: number, imageIndex: number) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((variant, idx) =>
        idx === variantIndex
          ? { ...variant, gallery: (variant.gallery || []).filter((_, gIdx) => gIdx !== imageIndex) }
          : variant,
      ),
    }));
  };

  const updateVariantGalleryImage = (variantIndex: number, imageIndex: number, value: string) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((variant, idx) =>
        idx === variantIndex
          ? { ...variant, gallery: (variant.gallery || []).map((img, gIdx) => (gIdx === imageIndex ? value : img)) }
          : variant,
      ),
    }));
  };

  const quickAddStorageVariants = () => {
    const storages = normalizeQuickList(quickStorageList);
    if (storages.length === 0) {
      toast({ title: "Enter storage values first", description: "Example: 128 GB, 256 GB", variant: "destructive" });
      return;
    }

    if (form.variants.length === 0) {
      toast({
        title: "Add one base variant first",
        description: "Create a variant (with SKU) to clone, then use Quick Add Storages.",
        variant: "destructive",
      });
      return;
    }

    const baseIndex = Math.min(Math.max(Number(quickStorageCloneIndex) || 0, 0), form.variants.length - 1);
    const baseVariant = form.variants[baseIndex];
    const baseSku = (baseVariant.sku || "").trim();
    const prefix = baseSku ? baseSku : toSkuPrefix(form.name);

    const existingSkuSet = new Set(form.variants.map((v) => (v.sku || "").trim()).filter(Boolean));
    const existingStorageSet = new Set(
      form.variants
        .map((v) => (v.storage || "").trim().toLowerCase())
        .filter(Boolean),
    );

    const newVariants: VariantForm[] = [];
    storages.forEach((storage) => {
      const normalizedStorage = storage.trim();
      if (!normalizedStorage) return;
      if (existingStorageSet.has(normalizedStorage.toLowerCase())) return;

      const token = toSkuToken(normalizedStorage);
      let nextSku = token ? `${prefix}-${token}` : prefix;
      if (!nextSku.trim()) nextSku = toSkuPrefix(form.name);

      let counter = 1;
      while (existingSkuSet.has(nextSku)) {
        counter += 1;
        nextSku = token ? `${prefix}-${token}-${counter}` : `${prefix}-${counter}`;
      }

      existingSkuSet.add(nextSku);
      existingStorageSet.add(normalizedStorage.toLowerCase());

      newVariants.push({
        ...baseVariant,
        sku: nextSku,
        storage: normalizedStorage,
        name: baseVariant.name || undefined,
      });
    });

    if (newVariants.length === 0) {
      toast({
        title: "No new variants added",
        description: "Those storage values already exist in variants.",
      });
      return;
    }

    setForm((f) => ({ ...f, variants: [...f.variants, ...newVariants] }));
    setQuickStorageList("");
    toast({ title: `Added ${newVariants.length} storage variants` });
  };

  const addGalleryImage = () => setForm((f) => ({ ...f, gallery: [...f.gallery, ""] }));
  const removeGalleryImage = (i: number) => setForm((f) => ({
    ...f,
    gallery: f.gallery.filter((_, idx) => idx !== i),
  }));
  const updateGalleryImage = (i: number, value: string) => setForm((f) => ({
    ...f,
    gallery: f.gallery.map((img, idx) => (idx === i ? value : img)),
  }));

  const sections = [
    { label: "Basic Info", icon: <Package className="w-4 h-4" /> },
    { label: "Images", icon: <ImageIcon className="w-4 h-4" /> },
    { label: "Pricing", icon: <Tag className="w-4 h-4" /> },
    { label: "Inventory", icon: <BarChart3 className="w-4 h-4" /> },
    { label: "Specifications", icon: <ListChecks className="w-4 h-4" /> },
    { label: "Variants", icon: <ListChecks className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{totalProducts} products listed</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white shadow-md">
          <Plus className="w-4 h-4" /> Add New Product
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={catFilter} onValueChange={setCatFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="pl-4">Product</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="hidden md:table-cell">Discount</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead className="hidden lg:table-cell">Status</TableHead>
                <TableHead className="text-right pr-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted border flex-shrink-0">
                        {p.image ? (
                          <img
                            src={getSafeProductImageUrl(p.image)}
                            alt={p.name}
                            className="block w-full h-auto object-cover"
                            style={{ width: "100%", height: "auto", objectFit: "cover" }}
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                                target.src = FALLBACK_PRODUCT_IMAGE;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                        {p.badge && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize font-semibold ${badgeColor[p.badge]}`}>
                            {p.badge}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{categoryLabel(p.category)}</TableCell>
                  <TableCell className="text-sm">
                    <div>
                      <span className="font-semibold">₹{p.price.toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground line-through ml-1.5">₹{p.mrp.toLocaleString()}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-green-600 font-semibold text-sm">{p.discount}% off</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm">
                    <span className={p.stock === 0 ? "text-red-500 font-medium" : p.stock < 10 ? "text-orange-500 font-medium" : "text-foreground"}>
                      {p.stock === 0 ? "Out of stock" : `${p.stock} units`}
                    </span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge[p.status]}`}>
                      {p.status.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 hover:bg-emerald-50 hover:text-emerald-600"
                        onClick={() => handleDuplicate(p)}
                        disabled={duplicatingId === p.id}
                        title="Duplicate product"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600" onClick={() => openEdit(p)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
                        onClick={() => { setDeletingId(p.id); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoadingProducts && products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No products found</p>
                  </TableCell>
                </TableRow>
              )}
              {isLoadingProducts && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <p className="text-sm">Loading products...</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="px-4 py-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Showing {products.length === 0 ? 0 : (currentPage - 1) * PRODUCTS_PER_PAGE + 1} to {Math.min(currentPage * PRODUCTS_PER_PAGE, totalProducts)} of {totalProducts}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isLoadingProducts}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {currentPage} of {Math.max(totalPages, 1)}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || isLoadingProducts}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Amazon-Style Add/Edit Product Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-0 gap-0 overflow-hidden">
          {/* Dialog Header */}
          <DialogHeader className="px-6 pt-5 pb-4 border-b bg-gradient-to-r from-orange-50 to-amber-50">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm">
                {editingProduct ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </span>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {editingProduct ? "Update product details below" : "Fill in all the details to list a new product"}
            </p>
          </DialogHeader>

          {/* Section Tabs */}
          <div className="flex border-b bg-white overflow-x-auto">
            {sections.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(i)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${activeSection === i
                    ? "border-orange-500 text-orange-600 bg-orange-50"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto max-h-[58vh] px-6 py-5">

            {/* Section 0: Basic Info */}
            {activeSection === 0 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Product Name <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="e.g. SoundDrum Pro Wireless Speaker"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">{form.name.length}/200 characters — Use a clear, descriptive title</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">General Name</Label>
                  <Input
                    placeholder="e.g. boAt Airdopes"
                    value={form.generalName}
                    onChange={(e) => setForm({ ...form, generalName: e.target.value })}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Used for simplified mobile view (e.g. grouped product name)</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Category <span className="text-red-500">*</span></Label>
                    <Select value={form.category || ""} onValueChange={(v) => setForm({ ...form, category: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Brand</Label>
                    <Select value={form.brand || "no-brand"} onValueChange={(v) => setForm({ ...form, brand: v === "no-brand" ? "" : v })} disabled={!form.category}>
                      <SelectTrigger><SelectValue placeholder={!form.category ? "Select category first" : "Select brand"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no-brand">No Brand</SelectItem>
                        {filteredBrands.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.category && filteredBrands.length === 0 && (
                      <p className="text-xs text-amber-600">⚠️ No brands available for this category</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Badge</Label>
                    <Select value={form.badge || "none"} onValueChange={(v) => setForm({ ...form, badge: v })}>
                      <SelectTrigger><SelectValue placeholder="No badge" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Badge</SelectItem>
                        <SelectItem value="sale">🏷️ Sale</SelectItem>
                        <SelectItem value="new">🆕 New Arrival</SelectItem>
                        <SelectItem value="bestseller">⭐ Bestseller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Status</Label>
                    <Select value={form.status || "active"} onValueChange={(v) => setForm({ ...form, status: v as ProductForm["status"] })}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">✅ Active — visible to customers</SelectItem>
                        <SelectItem value="draft">📝 Draft — hidden from store</SelectItem>
                        <SelectItem value="out_of_stock">❌ Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Product Description</Label>
                  <Textarea
                    placeholder="Describe your product — key features, use cases, and what makes it special..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-[100px] text-sm resize-none"
                  />
                  <p className="text-xs text-muted-foreground">{form.description.length} characters</p>
                </div>
              </div>
            )}

            {/* Section 1: Images */}
            {activeSection === 1 && (
              <div className="space-y-6">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                  💡 Paste a direct image URL (e.g. from Unsplash or your CDN). Recommended size: 400×400px or larger.
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold">Main Product Image URL</Label>
                  <Input
                    placeholder="https://example.com/product-image.jpg"
                    value={form.image}
                    onChange={(e) =>
                      setForm((prev) =>
                        syncVariant1Images(prev, { image: e.target.value }),
                      )
                    }
                    className="text-sm font-mono"
                  />
                  {form.image && (
                    <div className="flex items-start gap-4 mt-2 p-3 bg-muted/40 rounded-lg border">
                      <div className="w-24 flex-shrink-0">
                        <img
                          src={getSafeProductImageUrl(form.image)}
                          alt="Main preview"
                          className="block w-full h-auto object-cover rounded-lg border shadow-sm"
                          style={{ width: "100%", height: "auto", objectFit: "cover" }}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                              target.src = FALLBACK_PRODUCT_IMAGE;
                            }
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground pt-1">
                        <p className="font-semibold text-foreground mb-0.5">Main Image Preview</p>
                        <p>This is shown on product cards and as the primary product photo.</p>
                      </div>
                    </div>
                  )}
                  {!form.image && (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <p className="text-xs">Enter URL above to preview</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold">Hover / Second Image URL <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input
                    placeholder="https://example.com/product-hover-image.jpg"
                    value={form.hoverImage}
                    onChange={(e) =>
                      setForm((prev) =>
                        syncVariant1Images(prev, { hoverImage: e.target.value }),
                      )
                    }
                    className="text-sm font-mono"
                  />
                  {form.hoverImage && (
                    <div className="flex items-start gap-4 mt-2 p-3 bg-muted/40 rounded-lg border">
                      <div className="w-24 flex-shrink-0">
                        <img
                          src={getSafeProductImageUrl(form.hoverImage)}
                          alt="Hover preview"
                          className="block w-full h-auto object-cover rounded-lg border shadow-sm"
                          style={{ width: "100%", height: "auto", objectFit: "cover" }}
                          loading="lazy"
                          onError={(e) => {
                            const target = e.currentTarget;
                            if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                              target.src = FALLBACK_PRODUCT_IMAGE;
                            }
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground pt-1">
                        <p className="font-semibold text-foreground mb-0.5">Hover Image Preview</p>
                        <p>Shown when customer hovers over the product card.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label className="font-semibold">Additional Images <span className="text-muted-foreground font-normal">(add as many as you want)</span></Label>
                  <div className="space-y-2">
                    {form.gallery.length === 0 && (
                      <p className="text-xs text-muted-foreground">No additional images added yet.</p>
                    )}
                    {form.gallery.map((img, i) => (
                      <div key={i} className="flex gap-2">
                        <Input
                          placeholder={`https://example.com/image-${i + 1}.jpg`}
                          value={img}
                          onChange={(e) => updateGalleryImage(i, e.target.value)}
                          className="text-sm font-mono"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => removeGalleryImage(i)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={addGalleryImage}>
                      <Plus className="w-4 h-4" /> Add Image URL
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">These images appear in the product gallery.</p>
                </div>

                {/* Image count summary */}
                <div className="flex gap-2 mt-2">
                  {[form.image, form.hoverImage, ...form.gallery.map((s) => s.trim()).filter(Boolean)].filter(Boolean).map((url, i) => (
                    <div key={i} className="w-14 h-14 rounded-lg border overflow-hidden bg-muted">
                      <img
                        src={getSafeProductImageUrl(url)}
                        alt=""
                        className="block w-full h-auto object-cover"
                        style={{ width: "100%", height: "auto", objectFit: "cover" }}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== FALLBACK_PRODUCT_IMAGE) {
                            target.src = FALLBACK_PRODUCT_IMAGE;
                          }
                        }}
                      />
                    </div>
                  ))}
                  {[form.image, form.hoverImage].filter(Boolean).length < 2 && (
                    <div className="w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground bg-muted/20">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                  <p className="self-center text-xs text-muted-foreground ml-1">
                    {[form.image, form.hoverImage, ...form.gallery.map((s) => s.trim()).filter(Boolean)].filter(Boolean).length} images added
                  </p>
                </div>
              </div>
            )}

            {/* Section 2: Pricing */}
            {activeSection === 2 && (
              <div className="space-y-5">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                  💡 Discount % is automatically calculated from MRP and Selling Price. You can override it manually.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">MRP / Original Price (₹) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                      <Input
                        type="number"
                        placeholder="e.g. 2999"
                        value={form.mrp}
                        onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Maximum Retail Price — shown crossed out</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Selling Price (₹) <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₹</span>
                      <Input
                        type="number"
                        placeholder="e.g. 1299"
                        value={form.price}
                        onChange={(e) => setForm({ ...form, price: e.target.value })}
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Price customers actually pay</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Discount %</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Auto-calculated"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: e.target.value })}
                      className="pr-8"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">%</span>
                  </div>
                </div>

                {/* Live Pricing Preview */}
                {form.price && form.mrp && (
                  <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/50">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Price Preview (Customer View)</p>
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-2xl font-bold text-foreground">₹{Number(form.price).toLocaleString()}</span>
                      <span className="text-base text-muted-foreground line-through">₹{Number(form.mrp).toLocaleString()}</span>
                      {form.discount && (
                        <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">{form.discount}% off</span>
                      )}
                    </div>
                    {Number(form.price) > 1000 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        EMI: from ₹{Math.round(Number(form.price) / 6)}/month (No cost EMI)
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Section 3: Inventory */}
            {activeSection === 3 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Stock Quantity</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 50"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {Number(form.stock) === 0
                      ? "⚠️ Product will show as Out of Stock"
                      : Number(form.stock) < 10
                        ? `⚠️ Low stock — only ${form.stock} units available`
                        : `✅ ${form.stock} units in stock`}
                  </p>
                </div>

                {/* Stock status indicator */}
                {form.stock && (
                  <div className={`p-4 rounded-xl border ${Number(form.stock) === 0
                      ? "bg-red-50 border-red-200 text-red-700"
                      : Number(form.stock) < 10
                        ? "bg-orange-50 border-orange-200 text-orange-700"
                        : "bg-green-50 border-green-200 text-green-700"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${Number(form.stock) === 0 ? "bg-red-500" :
                          Number(form.stock) < 10 ? "bg-orange-500" : "bg-green-500"
                        }`} />
                      <div>
                        <p className="font-semibold text-sm">
                          {Number(form.stock) === 0 ? "Out of Stock" :
                            Number(form.stock) < 10 ? "Low Stock" : "In Stock"}
                        </p>
                        <p className="text-xs opacity-80 mt-0.5">
                          {Number(form.stock) === 0
                            ? "Status will automatically update to Out of Stock"
                            : Number(form.stock) < 10
                              ? "Consider restocking soon"
                              : "Good inventory level"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Section 4: Specifications */}
            {activeSection === 4 && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                  💡 Add technical specifications like those shown on product pages. (e.g. Bluetooth: 5.3, Battery: 10 hours)
                </div>

                <div className="space-y-2">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Feature / Attribute</p>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Value</p>
                    <div className="w-8" />
                  </div>

                  {form.specifications.map((spec, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center p-2 rounded-lg bg-muted/30 border">
                      <Input
                        placeholder="e.g. Bluetooth"
                        value={spec.feature}
                        onChange={(e) => updateSpec(i, "feature", e.target.value)}
                        className="text-sm bg-white"
                      />
                      <Input
                        placeholder="e.g. 5.3"
                        value={spec.value}
                        onChange={(e) => updateSpec(i, "value", e.target.value)}
                        className="text-sm bg-white"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                        onClick={() => removeSpec(i)}
                        disabled={form.specifications.length === 1}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="gap-2 text-sm border-dashed" onClick={addSpec}>
                  <Plus className="w-4 h-4" /> Add Specification Row
                </Button>

                {/* Preview table */}
                {form.specifications.some((s) => s.feature && s.value) && (
                  <div className="mt-4 border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 border-b">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Specifications Preview</p>
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {form.specifications.filter((s) => s.feature && s.value).map((s, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                            <td className="px-4 py-2.5 font-medium text-muted-foreground w-1/2">{s.feature}</td>
                            <td className="px-4 py-2.5 font-semibold">{s.value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Section 5: Variants */}
            {activeSection === 5 && (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                  💡 Add variants for different colors, storage, or sizes. Each variant can optionally override product-level images, pricing, inventory, and specifications.
                </div>

                <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">Quick Add Storages</p>
                      <p className="text-xs text-muted-foreground">Clones an existing variant and creates new variants with different storage values.</p>
                    </div>
                    <div className="w-full sm:w-56">
                      <Select value={quickStorageCloneIndex} onValueChange={setQuickStorageCloneIndex} disabled={form.variants.length === 0}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Clone from" />
                        </SelectTrigger>
                        <SelectContent>
                          {form.variants.map((v, idx) => (
                            <SelectItem key={idx} value={String(idx)}>
                              Variant {idx + 1}{v.sku?.trim() ? ` — ${v.sku.trim()}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Textarea
                    placeholder="Storages (comma or newline separated)\nExample:\n128 GB\n256 GB"
                    value={quickStorageList}
                    onChange={(e) => setQuickStorageList(e.target.value)}
                    className="min-h-[70px] text-sm"
                  />
                  <div className="flex items-center justify-end">
                    <Button variant="outline" size="sm" onClick={quickAddStorageVariants} disabled={form.variants.length === 0}>
                      <Plus className="w-4 h-4 mr-1.5" /> Add Storage Variants
                    </Button>
                  </div>
                </div>

                {form.variants.length === 0 && (
                  <p className="text-sm text-muted-foreground">No variants added yet. Product-level values will be used.</p>
                )}

                {form.variants.map((variant, i) => (
                  <div key={i} className="p-4 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-muted/30 to-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-primary">Variant {i + 1}</p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                        onClick={() => removeVariant(i)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Variant name (optional)"
                        value={variant.name}
                        onChange={(e) => updateVariant(i, "name", e.target.value)}
                      />
                      <Input
                        placeholder="SKU (required) *"
                        value={variant.sku}
                        onChange={(e) => updateVariant(i, "sku", e.target.value)}
                        className="border-primary/40"
                      />
                    </div>

                    {/* Attributes */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Select
                          value={
                            variant.colorMode === "custom"
                              ? CUSTOM_COLOR_VALUE
                              : (isPresetVariantColor(variant.color) ? normalizeColorToken(variant.color) : "")
                          }
                          onValueChange={(value) => {
                            if (value === CUSTOM_COLOR_VALUE) {
                              updateVariant(i, "colorMode", "custom");
                              if (isPresetVariantColor(variant.color)) updateVariant(i, "color", "");
                              return;
                            }

                            updateVariant(i, "colorMode", "preset");
                            updateVariant(i, "color", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select color" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from(new Set(PRESET_VARIANT_COLORS)).map((color) => (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-3 h-3 rounded-full border border-border"
                                    style={{ backgroundColor: getColorHex(color) }}
                                  />
                                  <span className="capitalize">{color}</span>
                                </div>
                              </SelectItem>
                            ))}
                            <SelectItem value={CUSTOM_COLOR_VALUE}>Custom…</SelectItem>
                          </SelectContent>
                        </Select>

                        {variant.colorMode === "custom" && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="color"
                              aria-label="Pick custom color"
                              className="w-14 px-1 py-1"
                              value={
                                /^#([0-9a-fA-F]{6})$/.test((variant.color || "").trim())
                                  ? (variant.color || "").trim()
                                  : "#808080"
                              }
                              onChange={(e) => updateVariant(i, "color", e.target.value)}
                            />
                            <Input
                              placeholder="#rrggbb"
                              value={variant.color}
                              onChange={(e) => updateVariant(i, "color", e.target.value)}
                            />
                          </div>
                        )}
                        {variant.color && (
                          <div className="flex items-center gap-2 p-2 bg-muted/30 rounded border text-xs">
                            <span className="text-muted-foreground">Preview:</span>
                            <div
                              className="w-8 h-8 rounded-full border-2 border-border shadow-sm"
                              style={{ backgroundColor: getColorHex(variant.color) }}
                            >
                              {variant.color.toLowerCase() === 'white' && (
                                <div className="w-full h-full rounded-full border border-gray-300" />
                              )}
                            </div>
                            <span className="font-medium capitalize">{variant.color}</span>
                          </div>
                        )}
                      </div>
                      <Input
                        placeholder="Storage (e.g., 256 GB)"
                        value={variant.storage}
                        onChange={(e) => updateVariant(i, "storage", e.target.value)}
                      />
                      <Input
                        placeholder="RAM (e.g., 8 GB)"
                        value={variant.ram}
                        onChange={(e) => updateVariant(i, "ram", e.target.value)}
                      />
                      <Input
                        placeholder="Size"
                        value={variant.size}
                        onChange={(e) => updateVariant(i, "size", e.target.value)}
                      />
                    </div>

                    {/* Override Section */}
                    <details className="group">
                      <summary className="cursor-pointer list-none p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                            <Tag className="w-4 h-4" />
                            Override Product-Level Values (Optional)
                          </span>
                          <span className="text-xs text-amber-700 group-open:hidden">Click to expand</span>
                        </div>
                      </summary>
                      
                      <div className="mt-3 space-y-4 p-3 bg-white/50 rounded-lg border">
                        {/* Override Images */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">Override Images</Label>
                          <Input
                            placeholder="Main image URL (leave empty to use product image)"
                            value={variant.image || ""}
                            onChange={(e) => updateVariant(i, "image", e.target.value)}
                            className="text-sm"
                          />
                          <Input
                            placeholder="Hover image URL (optional)"
                            value={variant.hoverImage || ""}
                            onChange={(e) => updateVariant(i, "hoverImage", e.target.value)}
                            className="text-sm"
                          />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <Label className="text-xs font-semibold text-muted-foreground">Override Gallery Images</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => addVariantGalleryImage(i)}
                              >
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Image
                              </Button>
                            </div>

                            {(variant.gallery || []).length === 0 && (
                              <p className="text-xs text-muted-foreground">No variant gallery overrides (product gallery will be used).</p>
                            )}

                            {(variant.gallery || []).map((img, imgIndex) => (
                              <div key={imgIndex} className="flex items-center gap-2">
                                <Input
                                  placeholder="Gallery image URL"
                                  value={img}
                                  onChange={(e) => updateVariantGalleryImage(i, imgIndex, e.target.value)}
                                  className="text-sm"
                                />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                                  onClick={() => removeVariantGalleryImage(i, imgIndex)}
                                  title="Remove image"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Override Pricing */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">Override Pricing</Label>
                          <div className="grid grid-cols-3 gap-3">
                            <Input
                              type="number"
                              placeholder={`Price (default: ₹${form.price || 0})`}
                              value={variant.price || ""}
                              onChange={(e) => updateVariant(i, "price", e.target.value)}
                              className="text-sm"
                            />
                            <Input
                              type="number"
                              placeholder={`MRP (default: ₹${form.mrp || 0})`}
                              value={variant.mrp || ""}
                              onChange={(e) => updateVariant(i, "mrp", e.target.value)}
                              className="text-sm"
                            />
                            <Input
                              type="number"
                              placeholder={`Stock (default: ${form.stock || 0})`}
                              value={variant.stock || ""}
                              onChange={(e) => updateVariant(i, "stock", e.target.value)}
                              className="text-sm"
                            />
                          </div>
                        </div>

                        {/* Override Specifications */}
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground">Override Specifications</Label>
                          <p className="text-xs text-muted-foreground mb-2">Add variant-specific specs (leave empty to use product specs)</p>
                          {variant.specifications && variant.specifications.length > 0 ? (
                            <>
                              {variant.specifications.map((spec, specIdx) => (
                                <div key={specIdx} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                                  <Input
                                    placeholder="Feature"
                                    value={spec.feature}
                                    onChange={(e) => {
                                      const newSpecs = [...(variant.specifications || [])];
                                      newSpecs[specIdx] = { ...newSpecs[specIdx], feature: e.target.value };
                                      updateVariant(i, "specifications", newSpecs as any);
                                    }}
                                    className="text-sm"
                                  />
                                  <Input
                                    placeholder="Value"
                                    value={spec.value}
                                    onChange={(e) => {
                                      const newSpecs = [...(variant.specifications || [])];
                                      newSpecs[specIdx] = { ...newSpecs[specIdx], value: e.target.value };
                                      updateVariant(i, "specifications", newSpecs as any);
                                    }}
                                    className="text-sm"
                                  />
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-9 w-9"
                                    onClick={() => {
                                      const newSpecs = variant.specifications?.filter((_, idx) => idx !== specIdx) || [];
                                      updateVariant(i, "specifications", newSpecs as any);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => {
                                  const newSpecs = [...(variant.specifications || []), { feature: "", value: "" }];
                                  updateVariant(i, "specifications", newSpecs as any);
                                }}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Spec
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs w-full"
                              onClick={() => {
                                updateVariant(i, "specifications", [{ feature: "", value: "" }] as any);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" /> Add Variant-Specific Specifications
                            </Button>
                          )}
                        </div>
                      </div>
                    </details>
                  </div>
                ))}

                <Button variant="outline" size="sm" className="gap-2" onClick={addVariant}>
                  <Plus className="w-4 h-4" /> Add Variant
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-muted/20 flex-row justify-between items-center gap-3">
            <div className="flex gap-2">
              {sections.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSection(i)}
                  className={`w-2 h-2 rounded-full transition-all ${activeSection === i ? "bg-orange-500 w-5" : "bg-muted-foreground/30"}`}
                />
              ))}
            </div>
            <div className="flex gap-2">
              {activeSection > 0 && (
                <Button variant="outline" size="sm" onClick={() => setActiveSection((s) => s - 1)}>← Back</Button>
              )}
              {activeSection < sections.length - 1 ? (
                <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setActiveSection((s) => s + 1)}>
                  Next →
                </Button>
              ) : (
                <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow" onClick={handleSave}>
                  {editingProduct ? "Update Product" : "Publish Product"}
                </Button>
              )}
              <DialogClose asChild>
                <Button variant="ghost" size="sm">Cancel</Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" /> Delete Product
            </DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            Are you sure you want to delete this product? This action <strong>cannot be undone</strong> and the product will be permanently removed.
          </p>
          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Yes, Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
