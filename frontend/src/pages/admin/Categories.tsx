import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, FolderTree, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import type { AdminCategory } from "@/data/adminMockData";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useCategories } from "@/contexts/CategoriesContext";

export default function Categories() {
    const { refreshCategories } = useCategories();
    const [categories, setCategories] = useState<AdminCategory[]>([]);
    const [search, setSearch] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editing, setEditing] = useState<AdminCategory | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [form, setForm] = useState({ name: "", slug: "", description: "", image: "", items: "", status: "active" as "active" | "inactive" });

    const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        api.adminListCategories()
            .then((data) => {
                const mapped = data.map((c) => ({
                    id: c.id,
                    name: c.title,
                    slug: c.slug,
                    image: c.image,
                    productCount: c.productCount || 0,
                    status: c.status || "active",
                    description: c.description || "",
                    items: c.items || [],
                })) as AdminCategory[];
                setCategories(mapped);
            })
            .catch((error) => {
                toast({ title: "Failed to load categories", description: (error as Error).message, variant: "destructive" });
            });
    }, []);

    const openAdd = () => {
        setEditing(null);
        setForm({ name: "", slug: "", description: "", image: "", items: "", status: "active" });
        setDialogOpen(true);
    };

    const openEdit = (cat: AdminCategory) => {
        setEditing(cat);
        setForm({ name: cat.name, slug: cat.slug, description: cat.description, image: cat.image, items: (cat.items || []).join("\n"), status: cat.status });
        setDialogOpen(true);
    };

    const autoSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const handleSave = async () => {
        if (!form.name.trim()) return;
        try {
            if (editing) {
                const updated = await api.adminUpdateCategory(editing.id, {
                    name: form.name,
                    slug: form.slug || autoSlug(form.name),
                    image: form.image,
                    status: form.status,
                    description: form.description,
                    items: form.items
                        .split(/\r?\n|,/)
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                });
                setCategories((prev) => prev.map((c) => c.id === editing.id ? {
                    ...c,
                    name: updated.title,
                    slug: updated.slug,
                    image: updated.image,
                    status: updated.status || "active",
                    description: updated.description || "",
                    items: updated.items || [],
                } : c));
                toast({ title: "Category updated!" });
                refreshCategories();
            } else {
                const created = await api.adminCreateCategory({
                    name: form.name,
                    slug: form.slug || autoSlug(form.name),
                    image: form.image,
                    status: form.status,
                    description: form.description,
                    items: form.items
                        .split(/\r?\n|,/)
                        .map((entry) => entry.trim())
                        .filter(Boolean),
                });
                const newCat: AdminCategory = {
                    id: created.id,
                    name: created.title,
                    slug: created.slug,
                    image: created.image,
                    productCount: created.productCount || 0,
                    status: created.status || "active",
                    description: created.description || "",
                    items: created.items || [],
                } as AdminCategory;
                setCategories((prev) => [newCat, ...prev]);
                toast({ title: "Category added!" });
                refreshCategories();
            }
            setDialogOpen(false);
        } catch (error) {
            toast({ title: "Failed to save category", description: (error as Error).message, variant: "destructive" });
        }
    };

    const handleDelete = async () => {
        if (deletingId) {
            try {
                await api.adminDeleteCategory(deletingId);
                setCategories((prev) => prev.filter((c) => c.id !== deletingId));
                toast({ title: "Category deleted" });
                refreshCategories();
            } catch (error) {
                toast({ title: "Failed to delete category", description: (error as Error).message, variant: "destructive" });
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
                    <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">{categories.length} categories total</p>
                </div>
                <Button onClick={openAdd} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="w-4 h-4" /> Add Category
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search categories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((cat) => (
                    <Card key={cat.id} className="overflow-hidden hover:shadow-md transition-shadow group">
                        <div className="relative h-36 bg-muted overflow-hidden">
                            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8 bg-black/75 text-white border border-white/50 shadow-md hover:bg-black"
                                    onClick={() => openEdit(cat)}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-8 w-8 bg-black/75 text-white border border-white/50 shadow-md hover:bg-red-600 hover:text-white"
                                    onClick={() => { setDeletingId(cat.id); setDeleteDialogOpen(true); }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                            <div className="absolute bottom-2 left-3">
                                <h3 className="text-white font-bold text-base">{cat.name}</h3>
                            </div>
                        </div>
                        <CardContent className="p-3 space-y-2">
                            <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-muted-foreground">{cat.productCount} products</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide ${cat.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                    }`}>
                                    {cat.status}
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono">/{cat.slug}</p>
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
                    <span className="text-sm font-medium">Add Category</span>
                </button>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderTree className="w-5 h-5 text-orange-500" />
                            {editing ? "Edit Category" : "Add New Category"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-1">
                        <div className="space-y-1.5">
                            <Label className="font-semibold">Category Name <span className="text-red-500">*</span></Label>
                            <Input
                                placeholder="e.g. Wireless Earphones"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value, slug: autoSlug(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-semibold">URL Slug</Label>
                            <Input
                                placeholder="e.g. wireless-earphones"
                                value={form.slug}
                                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                className="font-mono text-sm"
                            />
                            <p className="text-xs text-muted-foreground">Auto-generated from name. Used in the URL.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-semibold">Description</Label>
                            <Textarea
                                placeholder="Short description of this category..."
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="text-sm resize-none min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-semibold">Subcategories</Label>
                            <Textarea
                                placeholder="One per line (e.g. Samsung, Xiaomi, Realme)"
                                value={form.items}
                                onChange={(e) => setForm({ ...form, items: e.target.value })}
                                className="text-sm resize-none min-h-[90px]"
                            />
                            <p className="text-xs text-muted-foreground">Shown in the navbar mega menu.</p>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-semibold">Image URL</Label>
                            <Input
                                placeholder="https://..."
                                value={form.image}
                                onChange={(e) => setForm({ ...form, image: e.target.value })}
                                className="text-sm font-mono"
                            />
                            {form.image && (
                                <img src={form.image} alt="" className="w-20 h-20 object-cover rounded-lg border mt-1"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label className="font-semibold">Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "inactive" })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">✅ Active</SelectItem>
                                    <SelectItem value="inactive">⏸️ Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600 text-white">
                            {editing ? "Update" : "Add Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader><DialogTitle className="text-red-600 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete Category</DialogTitle></DialogHeader>
                    <p className="text-sm text-muted-foreground">Are you sure? All products in this category will be uncategorised. This action cannot be undone.</p>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
