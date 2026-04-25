import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Tag, Calendar, Percent, Coins, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minPurchase: number;
  maxDiscount?: number;
  expirationDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  applicabilityType?: "all" | "brand" | "category" | "product";
  applicabilityValue?: string;
  applicabilityLabel?: string;
  createdAt: string;
}

const defaultForm = {
  code: "",
  discountType: "percentage",
  discountValue: "",
  minPurchase: "0",
  maxDiscount: "",
  expirationDate: "",
  usageLimit: "1000",
  applicabilityType: "all",
  applicabilityValue: "",
  applicabilityLabel: "",
};

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState(defaultForm);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [categories, setCategories] = useState<Array<{ id: string; title: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; title: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    const loadApplicabilityData = async () => {
      try {
        const [brandsData, categoriesData, productsData] = await Promise.all([
          api.adminListBrands(),
          api.adminListCategories(),
          api.adminListProducts({ limit: 500 }),
        ]);

        setBrands(
          (brandsData || []).map((brand: any) => ({
            id: brand.id || brand._id || brand.slug || brand.name,
            name: brand.name || brand.title || "",
          })),
        );

        setCategories(
          (categoriesData || []).map((category: any) => ({
            id: category.id || category._id || category.slug || category.title,
            title: category.title || category.name || "",
          })),
        );

        setProducts(
          (productsData?.items || []).map((product: any) => ({
            id: product.id || product._id,
            title: product.title || product.name || "",
          })),
        );
      } catch {
        // If lookup data fails, coupon creation still works for global coupons.
      }
    };

    loadApplicabilityData();
  }, []);

  const selectedApplicabilityLabel =
    formData.applicabilityType === "brand"
      ? brands.find((item) => item.name === formData.applicabilityValue)?.name || ""
      : formData.applicabilityType === "category"
      ? categories.find((item) => item.title === formData.applicabilityValue)?.title || ""
      : formData.applicabilityType === "product"
      ? products.find((item) => item.id === formData.applicabilityValue)?.title || ""
      : "";

  const fetchCoupons = async () => {
    try {
      const data = await api.adminListCoupons();
      setCoupons(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      ["brand", "category", "product"].includes(formData.applicabilityType) &&
      !formData.applicabilityValue
    ) {
      toast({
        title: "Error",
        description: "Please select a target for coupon applicability",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      await api.adminCreateCoupon({
        ...formData,
        discountValue: Number(formData.discountValue),
        minPurchase: Number(formData.minPurchase),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : undefined,
        usageLimit: Number(formData.usageLimit),
        applicabilityLabel: selectedApplicabilityLabel || undefined,
      });

      toast({
        title: "Success",
        description: "Coupon created successfully",
      });
      setIsAddOpen(false);
      setFormData(defaultForm);
      fetchCoupons();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create coupon",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.adminDeleteCoupon(id);
      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });
      fetchCoupons();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  const filteredCoupons = coupons.filter((coupon) =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Coupons</h2>
          <p className="text-muted-foreground">Manage discount codes and promotions</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Coupon
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search coupons..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader className="p-0">
          {/* Header content if needed */}
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Purchase</TableHead>
                <TableHead>Usage</TableHead>
                    <TableHead>Applies To</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCoupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                    No coupons found
                  </TableCell>
                </TableRow>
              ) : (
                filteredCoupons.map((coupon) => (
                  <TableRow key={coupon._id}>
                    <TableCell className="font-medium bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-mono text-primary">{coupon.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {coupon.discountType === "percentage"
                        ? `${coupon.discountValue}% off`
                        : `₹${coupon.discountValue} off`}
                      {coupon.maxDiscount && (
                        <span className="text-xs text-muted-foreground block">
                          Up to ₹{coupon.maxDiscount}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>₹{coupon.minPurchase}</TableCell>
                    <TableCell>
                      {coupon.usedCount} / {coupon.usageLimit}
                    </TableCell>
                    <TableCell>
                      {coupon.applicabilityType && coupon.applicabilityType !== "all"
                        ? `${coupon.applicabilityType}: ${coupon.applicabilityLabel || coupon.applicabilityValue || "-"}`
                        : "All products"}
                    </TableCell>
                    <TableCell>{format(new Date(coupon.expirationDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          new Date() > new Date(coupon.expirationDate)
                            ? "bg-red-100 text-red-800"
                            : coupon.usedCount >= coupon.usageLimit
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {new Date() > new Date(coupon.expirationDate)
                          ? "Expired"
                          : coupon.usedCount >= coupon.usageLimit
                          ? "Limit Reached"
                          : "Active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(coupon._id)}
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription>
              Create a new discount code for your customers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code</Label>
              <Input
                id="code"
                placeholder="e.g. SUMMER2026"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value.toUpperCase() })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Type</Label>
                <Select
                  value={formData.discountType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, discountType: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Value</Label>
                <div className="relative">
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.discountValue}
                    onChange={(e) =>
                      setFormData({ ...formData, discountValue: e.target.value })
                    }
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-muted-foreground text-sm">
                    {formData.discountType === "percentage" ? "%" : "₹"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPurchase">Min Purchase (₹)</Label>
                <Input
                  id="minPurchase"
                  type="number"
                  min="0"
                  value={formData.minPurchase}
                  onChange={(e) =>
                    setFormData({ ...formData, minPurchase: e.target.value })
                  }
                />
              </div>
              {formData.discountType === "percentage" && (
                <div className="space-y-2">
                  <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    min="0"
                    placeholder="Optional"
                    value={formData.maxDiscount}
                    onChange={(e) =>
                      setFormData({ ...formData, maxDiscount: e.target.value })
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="applicabilityType">Coupon Applicability</Label>
              <Select
                value={formData.applicabilityType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    applicabilityType: value,
                    applicabilityValue: "",
                    applicabilityLabel: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="brand">Specific Brand</SelectItem>
                  <SelectItem value="category">Specific Category</SelectItem>
                  <SelectItem value="product">Specific Product</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.applicabilityType === "brand" && (
              <div className="space-y-2">
                <Label>Select Brand</Label>
                <Select
                  value={formData.applicabilityValue}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      applicabilityValue: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.name}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.applicabilityType === "category" && (
              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select
                  value={formData.applicabilityValue}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      applicabilityValue: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.title}>
                        {category.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.applicabilityType === "product" && (
              <div className="space-y-2">
                <Label>Select Product</Label>
                <Select
                  value={formData.applicabilityValue}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      applicabilityValue: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Expiration Date</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) =>
                    setFormData({ ...formData, expirationDate: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usageLimit">Usage Limit</Label>
                <Input
                  id="usageLimit"
                  type="number"
                  min="1"
                  value={formData.usageLimit}
                  onChange={(e) =>
                    setFormData({ ...formData, usageLimit: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Coupon"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
