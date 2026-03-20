import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  category: string;
  categories: string[];
  categoryName?: string;
  categoryNames?: string[];
  productCount: number;
  status: "active" | "inactive";
  description: string;
}

interface Category {
  id: string;
  title: string;
  slug: string;
}

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState({ 
    name: "", 
    slug: "", 
    categories: [] as string[], 
    description: "", 
    logo: "", 
    status: "active" as "active" | "inactive" 
  });

  const filtered = brands.filter((b) => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.categoryNames && b.categoryNames.join(" ").toLowerCase().includes(search.toLowerCase())) ||
    (b.categoryName && b.categoryName.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [brandsData, categoriesData] = await Promise.all([
        api.adminListBrands(),
        api.adminListCategories(),
      ]);

      // Map category slugs to names
      const categoryMap = new Map(categoriesData.map(c => [c.slug, c.title]));
      
      const mappedBrands = brandsData.map((b: any) => ({
        id: b._id || b.id,
        name: b.name,
        slug: b.slug,
        logo: b.logo || "",
        category: b.category,
        categories: b.categories || (b.category ? [b.category] : []),
        categoryName: categoryMap.get(b.category) || b.category,
        categoryNames: (b.categories || (b.category ? [b.category] : [])).map((slug: string) => categoryMap.get(slug) || slug),
        productCount: b.productCount || 0,
        status: b.status || "active",
        description: b.description || "",
      }));

      setBrands(mappedBrands);
      setCategories(categoriesData);
    } catch (error) {
      toast({ 
        title: "Failed to load brands", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", slug: "", categories: [], description: "", logo: "", status: "active" });
    setDialogOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setForm({ 
      name: brand.name, 
      slug: brand.slug, 
      categories: brand.categories || (brand.category ? [brand.category] : []),
      description: brand.description, 
      logo: brand.logo, 
      status: brand.status 
    });
    setDialogOpen(true);
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Brand name is required", variant: "destructive" });
      return;
    }
    if (form.categories.length === 0) {
      toast({ title: "Please select at least one category", variant: "destructive" });
      return;
    }

    try {
      if (editing) {
        await api.adminUpdateBrand(editing.id, {
          name: form.name,
          slug: form.slug || autoSlug(form.name),
          logo: form.logo,
          category: form.categories[0],
          categories: form.categories,
          status: form.status,
          description: form.description,
        });
        toast({ title: "Brand updated!" });
      } else {
        await api.adminCreateBrand({
          name: form.name,
          slug: form.slug || autoSlug(form.name),
          logo: form.logo,
          category: form.categories[0],
          categories: form.categories,
          status: form.status,
          description: form.description,
        });
        toast({ title: "Brand added!" });
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ 
        title: "Failed to save brand", 
        description: (error as Error).message, 
        variant: "destructive" 
      });
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await api.adminDeleteBrand(deletingId);
        toast({ title: "Brand deleted" });
        loadData();
      } catch (error) {
        toast({ 
          title: "Failed to delete brand", 
          description: (error as Error).message, 
          variant: "destructive" 
        });
      } finally {
        setDeleteDialogOpen(false);
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Brands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{brands.length} brands total</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4" /> Add Brand
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search brands..." 
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
          className="pl-9" 
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((brand) => (
          <Card key={brand.id} className="overflow-hidden hover:shadow-md transition-shadow group">
            <div className="relative h-36 bg-muted overflow-hidden flex items-center justify-center">
              {brand.logo ? (
                <img 
                  src={brand.logo} 
                  alt={brand.name} 
                  className="max-w-[80%] max-h-[80%] object-contain group-hover:scale-105 transition-transform duration-300" 
                />
              ) : (
                <Tag className="w-16 h-16 text-muted-foreground/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-7 w-7 bg-white/90 hover:bg-white" 
                  onClick={() => openEdit(brand)}
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="h-7 w-7 bg-white/90 hover:bg-red-100 hover:text-red-600"
                  onClick={() => { setDeletingId(brand.id); setDeleteDialogOpen(true); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="absolute bottom-2 left-3">
                <h3 className="text-white font-bold text-base">{brand.name}</h3>
              </div>
            </div>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(brand.categoryNames?.length ? brand.categoryNames : [brand.categoryName || brand.category]).filter(Boolean).map((category) => (
                    <span key={category} className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{brand.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {brand.productCount} products
                </span>
                <span 
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                    brand.status === "active" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {brand.status}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">/{brand.slug}</p>
            </CardContent>
          </Card>
        ))}

        {/* Add New Card */}
        <button
          onClick={openAdd}
          className="h-full min-h-[200px] flex flex-col items-center justify-center gap-2 border-2 border-dashed border-muted-foreground/30 rounded-xl text-muted-foreground hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
        >
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-sm font-medium">Add Brand</span>
        </button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Brand" : "Add Brand"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input 
                id="name" 
                value={form.name} 
                onChange={(e) => setForm({ ...form, name: e.target.value })} 
                placeholder="e.g., Samsung, Apple, Sony"
              />
            </div>

            <div className="space-y-2">
              <Label>Categories *</Label>
              <div className="rounded-lg border bg-background p-3 max-h-64 overflow-y-auto space-y-2">
                {categories.map((cat) => {
                  const checked = form.categories.includes(cat.slug);
                  return (
                    <label key={cat.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50 cursor-pointer">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          const nextCategories = value
                            ? [...form.categories, cat.slug]
                            : form.categories.filter((slug) => slug !== cat.slug);
                          setForm({ ...form, categories: nextCategories });
                        }}
                      />
                      <span className="text-sm">{cat.title}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Select one or more categories this brand should appear in.
              </p>
              {form.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.categories.map((slug) => (
                    <span key={slug} className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      {categories.find((cat) => cat.slug === slug)?.title || slug}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input 
                id="slug" 
                value={form.slug} 
                onChange={(e) => setForm({ ...form, slug: e.target.value })} 
                placeholder="auto-generated if empty"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo">Logo URL / Banner</Label>
              <Input 
                id="logo" 
                value={form.logo} 
                onChange={(e) => setForm({ ...form, logo: e.target.value })} 
                placeholder="https://example.com/logo.png"
                className="text-sm font-mono"
              />
              {form.logo && (
                <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border">
                  <img
                    src={form.logo}
                    alt="Logo preview"
                    className="h-20 w-20 object-contain rounded border bg-white p-1"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  <div className="text-xs text-muted-foreground pt-2">
                    <p className="font-semibold text-foreground mb-0.5">Logo Preview</p>
                    <p>This logo will appear on the brand page header</p>
                  </div>
                </div>
              )}
              {!form.logo && (
                <div className="flex items-center justify-center h-20 border-2 border-dashed rounded-lg text-muted-foreground bg-muted/20">
                  <span className="text-xs">Enter URL above to preview</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                rows={3}
                placeholder="Brief description about the brand..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={form.status} onValueChange={(val: "active" | "inactive") => setForm({ ...form, status: val })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">
              {editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this brand? This action cannot be undone.
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
