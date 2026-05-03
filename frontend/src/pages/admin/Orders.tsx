import { useEffect, useState, useMemo } from "react";
import { 
  Eye, 
  Search, 
  Filter, 
  ShoppingBag, 
  Clock, 
  Truck, 
  IndianRupee, 
  TrendingUp,
  Printer,
  Download,
  Trash2,
  CreditCard,
  XCircle,
  CheckCircle,
  Edit,
  Package,
  MapPin,
  Mail,
  Phone,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ImageGallery } from "@/components/product/ImageGallery";
import { ProductTabs } from "@/components/product/ProductTabs";
import type { AdminOrder } from "@/data/adminMockData";
import type { ProductDetail } from "@/data/productDetails";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-purple-100 text-purple-800 border-purple-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

const paymentColor: Record<string, string> = {
  paid: "bg-green-100 text-green-800 border-green-300",
  unpaid: "bg-red-100 text-red-800 border-red-300",
  refunded: "bg-gray-100 text-gray-800 border-gray-300",
};

type OrderItem = {
  name: string;
  qty: number;
  price: number;
  image?: string;
  category?: string;
  productId?: string;
  variant?: {
    name?: string;
    sku?: string;
    price?: number;
    mrp?: number;
    attributes?: {
      color?: string;
      storage?: string;
      ram?: string;
      size?: string;
    };
  } | string;
};

interface ExtendedOrder extends AdminOrder {
  phone?: string;
  paymentMethod?: string;
  upiTransactionId?: string;
  shippingCost?: number;
  subtotal?: number;
  trackingNumber?: string;
  courierName?: string;
  items: OrderItem[];
}

const looksLikeObjectId = (value?: string) => {
  return Boolean(value && /^[a-f\d]{24}$/i.test(value.trim()));
};

const formatShippingAddress = (shippingAddress?: {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}) => {
  if (!shippingAddress) return "";

  const parts = [
    shippingAddress.line1,
    shippingAddress.line2,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.postalCode,
    shippingAddress.country,
  ]
    .map((part) => (part || "").trim())
    .filter(Boolean);

  return parts.join(", ");
};

export default function Orders() {
  const [orders, setOrders] = useState<ExtendedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ExtendedOrder | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [courierName, setCourierName] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [productPreview, setProductPreview] = useState<ProductDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [orderedVariantLabel, setOrderedVariantLabel] = useState<string | null>(null);
  const [orderedVariant, setOrderedVariant] = useState<ProductDetail["variants"][number] | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    api.adminListOrders()
      .then((data) => {
        const mapped = data.map((order) => ({
          id: order.id || order._id || "",
          customer: order.customerName || "",
          email: order.email || "",
          phone: order.phone || order.shippingAddress?.phone || "+91 9876543210",
          total: order.total || 0,
          status: order.status || "pending",
          paymentStatus: order.paymentStatus || "unpaid",
          paymentMethod: order.paymentMethod || "COD",
          upiTransactionId: order.upiTransactionId || "",
          date: order.createdAt ? new Date(order.createdAt).toISOString().slice(0, 10) : "",
          items: order.items || [],
          address: formatShippingAddress(order.shippingAddress)
            || (looksLikeObjectId(order.address || "") ? "Address not available" : (order.address || "")),
          subtotal: order.subtotal || order.total - (order.shippingCost || 50),
          shippingCost: order.shippingCost || 50,
          trackingNumber: order.trackingNumber || "",
          courierName: order.courierName || "",
        })) as ExtendedOrder[];
        setOrders(mapped);
      })
      .catch((error) => {
        toast({ title: "Failed to load orders", description: (error as Error).message, variant: "destructive" });
      });
  }, []);

  useEffect(() => {
    setExpandedItems({});
  }, [selectedOrder?.id]);

  const buildDetail = (base: ProductDetail): ProductDetail => {
    const images = base.images && base.images.length > 0
      ? base.images
      : [base.image, base.hoverImage].filter(Boolean);

    return {
      ...base,
      title: base.title || base.name || "",
      brand: base.brand || "TechBrand",
      description: base.description || `Experience premium quality with the ${base.title || base.name || "product"}.`,
      images: images.length > 0 ? images : [base.image].filter(Boolean),
      specifications: base.specifications || [],
      availability: base.availability || "In Stock",
      deliveryInfo: base.deliveryInfo || "Free delivery in 2-5 days.",
      returnPolicy: base.returnPolicy || "Replacement only for defective products within 7 days.",
      reviews: base.reviews || [],
      ratingBreakdown: base.ratingBreakdown || [],
      variants: base.variants || [],
    } as ProductDetail;
  };

  const buildVariantLabel = (variant: OrderItem["variant"]) => {
    if (!variant) return "";
    if (typeof variant === "string") return variant;
    const attributes = variant.attributes || {};
    return [
      variant.name,
      attributes.color,
      attributes.storage && `${attributes.storage} Storage`,
      attributes.ram && `${attributes.ram} RAM`,
      attributes.size,
    ]
      .filter(Boolean)
      .join(" · ");
  };

  const matchVariant = (product: ProductDetail, item: OrderItem) => {
    const variants = product.variants || [];
    if (!variants.length) return null;

    if (item.variant && typeof item.variant === "object") {
      const { name, sku, attributes } = item.variant;
      return (
        variants.find((variant) => sku && variant.sku === sku) ||
        variants.find((variant) => name && variant.name === name) ||
        variants.find((variant) => {
          const vAttr = variant.attributes || {};
          return (
            (!attributes?.color || vAttr.color === attributes.color) &&
            (!attributes?.storage || vAttr.storage === attributes.storage) &&
            (!attributes?.ram || vAttr.ram === attributes.ram) &&
            (!attributes?.size || vAttr.size === attributes.size)
          );
        }) ||
        null
      );
    }

    if (typeof item.variant === "string") {
      const token = item.variant.toLowerCase();
      return (
        variants.find((variant) => variant.name?.toLowerCase() === token) ||
        variants.find((variant) => variant.sku?.toLowerCase() === token) ||
        variants.find((variant) =>
          [
            variant.name,
            variant.sku,
            variant.attributes?.color,
            variant.attributes?.storage,
            variant.attributes?.ram,
            variant.attributes?.size,
          ]
            .filter(Boolean)
            .some((val) => token.includes(String(val).toLowerCase())),
        ) ||
        null
      );
    }

    return null;
  };

  const openProductPreview = async (item: OrderItem) => {
    const productId = item.productId || (item as { product?: string }).product;
    if (!productId) {
      toast({ title: "Product reference missing", description: "Cannot load product details for this item.", variant: "destructive" });
      return;
    }
    try {
      setPreviewLoading(true);
      setOrderedVariantLabel(buildVariantLabel(item.variant));
      const apiProduct = await api.fetchProduct(productId);
      const detailed = buildDetail(apiProduct as ProductDetail);
      const matchedVariant = matchVariant(detailed, item);
      if (matchedVariant) {
        setOrderedVariant(matchedVariant);
      } else {
        setOrderedVariant(null);
      }
      setProductPreview(detailed);
    } catch (error) {
      toast({ title: "Failed to load product", description: (error as Error).message, variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  // Calculate summary statistics
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === "pending").length;
    const shippedOrders = orders.filter(o => o.status === "shipped" || o.status === "delivered").length;
    const totalRevenue = orders.filter(o => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0);
    
    return { totalOrders, pendingOrders, shippedOrders, totalRevenue };
  }, [orders]);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = searchQuery === "" || 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || order.paymentStatus === paymentFilter;
      
      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter]);

  // Sort by date (latest first)
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [filteredOrders]);

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const updateStatus = async (id: string, status: AdminOrder["status"]) => {
    try {
      await api.adminUpdateOrderStatus(id, { 
        status,
        trackingNumber: trackingNumber || undefined,
        courierName: courierName || undefined,
      });
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status, trackingNumber, courierName } : o)));
      if (selectedOrder?.id === id) {
        setSelectedOrder((prev) => prev ? { ...prev, status, trackingNumber, courierName } : null);
      }
      toast({ title: "Order updated", description: `Order ${id} status updated to ${status}` });
      
      // Reset tracking fields
      setTrackingNumber("");
      setCourierName("");
    } catch (error) {
      toast({ title: "Failed to update status", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handlePrint = () => {
    if (!selectedOrder) {
      toast({ title: "Select an order", variant: "destructive" });
      return;
    }
    const invoiceHtml = buildInvoiceHtml(selectedOrder);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(invoiceHtml);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleDownload = () => {
    if (!selectedOrder) {
      toast({ title: "Select an order", variant: "destructive" });
      return;
    }
    const invoiceHtml = buildInvoiceHtml(selectedOrder);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(invoiceHtml);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleDeleteOrder = async (order: ExtendedOrder) => {
    const confirmed = window.confirm(`Delete order ${order.id}? This action cannot be undone.`);
    if (!confirmed) return;
    try {
      await api.adminDeleteOrder(order.id);
      setOrders((prev) => prev.filter((entry) => entry.id !== order.id));
      if (selectedOrder?.id === order.id) {
        setSelectedOrder(null);
      }
      toast({ title: "Order deleted" });
    } catch (error) {
      toast({ title: "Failed to delete order", description: (error as Error).message, variant: "destructive" });
    }
  };

  const buildInvoiceHtml = (order: ExtendedOrder) => {
    const formatVariant = (item: OrderItem) => {
      if (!item.variant) return "";
      if (typeof item.variant === "string") return item.variant;
      const attrs = item.variant.attributes || {};
      return [
        item.variant.name,
        attrs.color,
        attrs.storage && `${attrs.storage} Storage`,
        attrs.ram && `${attrs.ram} RAM`,
        attrs.size,
      ]
        .filter(Boolean)
        .join(" · ");
    };

    const rows = order.items
      .map((item) => {
        const variant = formatVariant(item);
        return `
          <tr>
            <td style=\"padding:8px 0;\">${item.name}${variant ? ` <div style=\\\"color:#6b7280;font-size:12px;\\\">${variant}</div>` : ""}</td>
            <td style=\"padding:8px 0;text-align:center;\">${item.qty}</td>
            <td style=\"padding:8px 0;text-align:right;\">₹${item.price.toLocaleString()}</td>
            <td style=\"padding:8px 0;text-align:right;\">₹${(item.price * item.qty).toLocaleString()}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <html>
        <head>
          <title>Invoice ${order.id}</title>
        </head>
        <body style=\"font-family: Arial, sans-serif; color: #111827; padding: 24px;\">
          <h1 style=\"margin:0 0 4px;\">Vikash Telecom</h1>
          <p style=\"margin:0 0 16px; color:#6b7280;\">Invoice</p>
          <div style=\"display:flex; justify-content:space-between; margin-bottom:16px;\">
            <div>
              <div style=\"font-size:12px; color:#6b7280;\">Order ID</div>
              <div style=\"font-weight:600;\">${order.id}</div>
              <div style=\"font-size:12px; color:#6b7280; margin-top:8px;\">Order Date</div>
              <div>${order.date || "-"}</div>
            </div>
            <div style=\"text-align:right;\">
              <div style=\"font-size:12px; color:#6b7280;\">Payment Method</div>
              <div style=\"font-weight:600; text-transform:uppercase;\">${order.paymentMethod || "-"}</div>
              <div style=\"font-size:12px; color:#6b7280; margin-top:8px;\">Ship To</div>
              <div>${order.customer}</div>
              <div style=\"max-width:240px;\">${order.address || "-"}</div>
              <div>${order.phone || ""}</div>
            </div>
          </div>
          <table style=\"width:100%; border-collapse: collapse;\">
            <thead>
              <tr style=\"border-bottom:1px solid #e5e7eb; text-align:left;\">
                <th style=\"padding-bottom:8px;\">Item</th>
                <th style=\"padding-bottom:8px; text-align:center;\">Qty</th>
                <th style=\"padding-bottom:8px; text-align:right;\">Unit Price</th>
                <th style=\"padding-bottom:8px; text-align:right;\">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div style=\"margin-top:16px; display:flex; justify-content:flex-end;\">
            <div style=\"min-width:240px;\">
              <div style=\"display:flex; justify-content:space-between; margin-bottom:4px;\"><span>Subtotal</span><span>₹${(order.subtotal || 0).toLocaleString()}</span></div>
              <div style=\"display:flex; justify-content:space-between; margin-bottom:4px;\"><span>Shipping</span><span>₹${(order.shippingCost || 0).toLocaleString()}</span></div>
              <div style=\"display:flex; justify-content:space-between; font-weight:700; margin-top:8px; border-top:1px solid #e5e7eb; padding-top:8px;\">
                <span>Total</span><span>₹${order.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const handleRefund = () => {
    toast({ title: "Refund Initiated", description: "Processing refund..." });
    // Implement refund logic
  };

  const handleCancel = () => {
    if (selectedOrder) {
      updateStatus(selectedOrder.id, "cancelled");
    }
  };

  const handleMarkAsPaid = () => {
    toast({ title: "Payment Updated", description: "Order marked as paid" });
    // Implement mark as paid logic
  };

  const getOrderProgress = (status: string) => {
    const steps = ["pending", "processing", "shipped", "delivered"];
    const currentIndex = steps.indexOf(status);
    return steps.map((step, index) => ({
      label: step,
      active: index <= currentIndex,
      current: step === status,
    }));
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
        <p className="text-gray-500 mt-1">Manage and track all customer orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Orders */}
        <Card className="border-l-4 border-l-[#FF7A00] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Orders</p>
                <h3 className="text-3xl font-bold mt-2">{stats.totalOrders}</h3>
                <div className="flex items-center mt-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-[#FF7A00]/10 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6 text-[#FF7A00]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Orders */}
        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <h3 className="text-3xl font-bold mt-2">{stats.pendingOrders}</h3>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Requires attention</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipped Orders */}
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Shipped Orders</p>
                <h3 className="text-3xl font-bold mt-2">{stats.shippedOrders}</h3>
                <div className="flex items-center mt-2 text-sm text-purple-600">
                  <Truck className="w-4 h-4 mr-1" />
                  <span>In transit</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card className="border-l-4 border-l-green-500 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <h3 className="text-3xl font-bold mt-2">₹{stats.totalRevenue.toLocaleString()}</h3>
                <div className="flex items-center mt-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>+18% from last month</span>
                </div>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Section */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by Order ID or Customer name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Filter */}
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <CreditCard className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Order ID</TableHead>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Payment Method</TableHead>
                  <TableHead className="font-semibold">Payment Status</TableHead>
                  <TableHead className="font-semibold">Order Status</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="text-right font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm text-[#FF7A00] font-medium cursor-pointer hover:underline" onClick={() => setSelectedOrder(order)}>
                        {order.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customer}</div>
                        <div className="text-sm text-gray-500">{order.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{order.phone}</TableCell>
                      <TableCell className="font-semibold">₹{order.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {order.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${paymentColor[order.paymentStatus]} border capitalize`}>
                          {order.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColor[order.status]} border capitalize`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{order.date}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteOrder(order)} className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden divide-y">
            {paginatedOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No orders found
              </div>
            ) : (
              paginatedOrders.map((order) => (
                <div key={order.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-[#FF7A00] font-medium">{order.id.slice(0, 12)}...</p>
                      <p className="font-medium mt-1">{order.customer}</p>
                      <p className="text-sm text-gray-500">{order.phone}</p>
                    </div>
                    <Badge className={`${statusColor[order.status]} border capitalize`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Amount</p>
                      <p className="font-semibold text-lg">₹{order.total.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={`${paymentColor[order.paymentStatus]} border capitalize`}>
                        {order.paymentStatus}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">{order.date}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="w-full bg-[#FF7A00] hover:bg-[#FF7A00]/90"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteOrder(order)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Order
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, sortedOrders.length)} of {sortedOrders.length} orders
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === 1 || 
                             page === totalPages || 
                             (page >= currentPage - 1 && page <= currentPage + 1);
                    })
                    .map((page, index, array) => {
                      if (index > 0 && array[index - 1] !== page - 1) {
                        return (
                          <div key={`ellipsis-${page}`} className="flex items-center gap-1">
                            <span className="px-2">...</span>
                            <Button
                              size="sm"
                              variant={currentPage === page ? "default" : "outline"}
                              onClick={() => setCurrentPage(page)}
                              className={currentPage === page ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90" : ""}
                            >
                              {page}
                            </Button>
                          </div>
                        );
                      }
                      return (
                        <Button
                          key={page}
                          size="sm"
                          variant={currentPage === page ? "default" : "outline"}
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? "bg-[#FF7A00] hover:bg-[#FF7A00]/90" : ""}
                        >
                          {page}
                        </Button>
                      );
                    })}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Order Details Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => {
        if (!open) {
          setSelectedOrder(null);
          setTrackingNumber("");
          setCourierName("");
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer & Order Info Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Info */}
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-[#FF7A00]" />
                      Customer Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-[#FF7A00]/10 flex items-center justify-center mr-3 mt-0.5">
                          <Package className="w-4 h-4 text-[#FF7A00]" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">{selectedOrder.customer}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                          <Mail className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedOrder.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 mt-0.5">
                          <Phone className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{selectedOrder.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 mt-0.5">
                          <MapPin className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Shipping Address</p>
                          <p className="font-medium">{selectedOrder.address}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Info */}
                <Card className="shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2 text-[#FF7A00]" />
                      Order Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order ID</span>
                        <span className="font-mono font-medium text-[#FF7A00]">{selectedOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Method</span>
                        <Badge variant="outline">{selectedOrder.paymentMethod}</Badge>
                      </div>

                      {String(selectedOrder.paymentMethod || "").toLowerCase() === "upi" && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">UPI Transaction ID</span>
                          <span className="font-medium">{selectedOrder.upiTransactionId || "—"}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Status</span>
                        <Badge className={`${paymentColor[selectedOrder.paymentStatus]} border capitalize`}>
                          {selectedOrder.paymentStatus}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order Date</span>
                        <span className="font-medium flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                          {selectedOrder.date}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Subtotal</span>
                        <span>₹{(selectedOrder.subtotal || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Shipping</span>
                        <span>₹{(selectedOrder.shippingCost || 0).toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-[#FF7A00]">₹{selectedOrder.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card className="shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, i) => {
                      const variant = typeof item.variant === "string" ? item.variant : item.variant?.name;
                      const attributes = typeof item.variant === "string" ? null : item.variant?.attributes;
                      const attributeList = [
                        attributes?.color && `Color: ${attributes.color}`,
                        attributes?.storage && `Storage: ${attributes.storage}`,
                        attributes?.ram && `RAM: ${attributes.ram}`,
                        attributes?.size && `Size: ${attributes.size}`,
                      ].filter(Boolean);
                      const hasVariantDetails = Boolean(variant || attributeList.length > 0);

                      return (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => openProductPreview(item)}
                              className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden"
                            >
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <Package className="w-8 h-8 text-gray-400" />
                              )}
                            </button>
                            <div className="space-y-1">
                              <button
                                type="button"
                                onClick={() => openProductPreview(item)}
                                className="text-left font-medium hover:text-[#FF7A00]"
                              >
                                {item.name}
                              </button>
                              {item.category && (
                                <p className="text-xs text-gray-500">Category: {item.category}</p>
                              )}
                              {hasVariantDetails && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedItems((prev) => ({ ...prev, [i]: !prev[i] }))
                                  }
                                  className="text-xs font-semibold text-[#FF7A00]"
                                >
                                  {expandedItems[i] ? "Hide variant details" : "View variant details"}
                                </button>
                              )}
                              {expandedItems[i] && (
                                <div className="space-y-2">
                                  {variant && (
                                    <p className="text-xs text-gray-500">Variant: {variant}</p>
                                  )}
                                  {attributeList.length > 0 && (
                                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                                      {attributeList.map((attr) => (
                                        <span key={attr} className="rounded-full border border-gray-200 px-2 py-0.5">
                                          {attr}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => openProductPreview(item)}
                                className="text-xs font-semibold text-gray-500 hover:text-[#FF7A00]"
                              >
                                View product details
                              </button>
                              <p className="text-sm text-gray-500">Quantity: {item.qty}</p>
                              <p className="text-sm text-gray-500">Unit Price: ₹{item.price.toLocaleString()}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-lg">₹{(item.price * item.qty).toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card className="shadow-sm">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-4">Order Timeline</h3>
                  <div className="flex items-center justify-between">
                    {getOrderProgress(selectedOrder.status).map((step, index) => (
                      <div key={step.label} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            step.active ? 'bg-[#FF7A00] text-white' : 'bg-gray-200 text-gray-400'
                          } ${step.current ? 'ring-4 ring-[#FF7A00]/30' : ''}`}>
                            {step.active ? <CheckCircle className="w-5 h-5" /> : <div className="w-3 h-3 rounded-full bg-current" />}
                          </div>
                          <p className={`text-xs mt-2 capitalize ${step.active ? 'font-semibold text-[#FF7A00]' : 'text-gray-400'}`}>
                            {step.label}
                          </p>
                        </div>
                        {index < getOrderProgress(selectedOrder.status).length - 1 && (
                          <div className={`h-0.5 flex-1 ${step.active ? 'bg-[#FF7A00]' : 'bg-gray-200'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Update Status Section */}
              <Card className="shadow-sm border-[#FF7A00]/20">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-4">Update Order Status</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Order Status</Label>
                      <Select 
                        value={selectedOrder.status} 
                        onValueChange={(v) => updateStatus(selectedOrder.id, v as AdminOrder["status"])}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                            <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Tracking Number (Optional)</Label>
                      <Input 
                        placeholder="Enter tracking number"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Courier Name (Optional)</Label>
                      <Input 
                        placeholder="e.g. Blue Dart, Delhivery"
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                      />
                    </div>

                    <div className="flex items-end">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="notify"
                          checked={notifyCustomer}
                          onCheckedChange={(checked) => setNotifyCustomer(checked as boolean)}
                        />
                        <Label htmlFor="notify" className="cursor-pointer">
                          Notify customer via email
                        </Label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Print Invoice
                </Button>
                <Button onClick={handleDownload} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button onClick={() => selectedOrder && handleDeleteOrder(selectedOrder)} variant="outline" className="text-red-600 hover:text-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Order
                </Button>
                {selectedOrder.paymentStatus === "paid" && (
                  <Button onClick={handleRefund} variant="outline" className="text-red-600 hover:text-red-700">
                    <IndianRupee className="w-4 h-4 mr-2" />
                    Refund
                  </Button>
                )}
                {selectedOrder.paymentMethod === "COD" && selectedOrder.paymentStatus === "unpaid" && (
                  <Button onClick={handleMarkAsPaid} variant="outline" className="text-green-600 hover:text-green-700">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}
                {selectedOrder.status !== "cancelled" && selectedOrder.status !== "delivered" && (
                  <Button onClick={handleCancel} variant="outline" className="text-red-600 hover:text-red-700">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!productPreview} onOpenChange={(open) => {
        if (!open) {
          setProductPreview(null);
          setOrderedVariantLabel(null);
          setOrderedVariant(null);
        }
      }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Product Details</DialogTitle>
          </DialogHeader>
          {previewLoading && (
            <div className="py-10 text-center text-muted-foreground">Loading product details...</div>
          )}
          {productPreview && !previewLoading && (
            <div className="grid grid-cols-1 lg:grid-cols-[45%_55%] gap-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-border/50">
                <ImageGallery
                  images={
                    orderedVariant?.images && orderedVariant.images.length > 0
                      ? orderedVariant.images
                      : productPreview.images || [productPreview.image]
                  }
                  title={productPreview.title}
                />
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-border/50 space-y-4">
                {(() => {
                  const orderedSpecs = orderedVariant?.attributes
                    ? [
                        orderedVariant.attributes.color && { feature: "Color", value: orderedVariant.attributes.color },
                        orderedVariant.attributes.storage && { feature: "Storage", value: orderedVariant.attributes.storage },
                        orderedVariant.attributes.ram && { feature: "RAM", value: orderedVariant.attributes.ram },
                        orderedVariant.attributes.size && { feature: "Size", value: orderedVariant.attributes.size },
                      ].filter(Boolean)
                    : [];

                  const previewProduct = orderedVariant
                    ? {
                        ...productPreview,
                        variants: [orderedVariant],
                        specifications: (orderedSpecs as { feature: string; value: string }[]),
                      }
                    : productPreview;

                  return (
                    <>
                      <div>
                        <h2 className="text-2xl font-semibold">{previewProduct.title}</h2>
                        <p className="text-sm text-muted-foreground">Brand: {previewProduct.brand || "-"}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="text-2xl font-bold text-[#FF7A00]">
                          ₹{(orderedVariant?.price ?? previewProduct.price)?.toLocaleString()}
                        </span>
                        {(orderedVariant?.mrp ?? previewProduct.mrp) &&
                          (orderedVariant?.mrp ?? previewProduct.mrp) > (orderedVariant?.price ?? previewProduct.price) && (
                          <span className="text-sm text-gray-500 line-through">
                            ₹{(orderedVariant?.mrp ?? previewProduct.mrp)?.toLocaleString()}
                          </span>
                        )}
                        {orderedVariant?.discount || previewProduct.discount ? (
                          <span className="text-xs font-semibold text-green-600">
                            {orderedVariant?.discount ?? previewProduct.discount}% off
                          </span>
                        ) : null}
                      </div>
                      {(orderedVariant || orderedVariantLabel) && (
                        <div className="rounded-xl border border-gray-200 p-4 space-y-2">
                          <p className="text-sm font-semibold">Ordered variant</p>
                          {orderedVariantLabel && (
                            <p className="text-sm text-gray-600">{orderedVariantLabel}</p>
                          )}
                          {orderedVariant?.attributes && (
                            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                              {orderedVariant.attributes.color && (
                                <span className="rounded-full border border-gray-200 px-2 py-1">
                                  Color: {orderedVariant.attributes.color}
                                </span>
                              )}
                              {orderedVariant.attributes.storage && (
                                <span className="rounded-full border border-gray-200 px-2 py-1">
                                  Storage: {orderedVariant.attributes.storage}
                                </span>
                              )}
                              {orderedVariant.attributes.ram && (
                                <span className="rounded-full border border-gray-200 px-2 py-1">
                                  RAM: {orderedVariant.attributes.ram}
                                </span>
                              )}
                              {orderedVariant.attributes.size && (
                                <span className="rounded-full border border-gray-200 px-2 py-1">
                                  Size: {orderedVariant.attributes.size}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <ProductTabs product={previewProduct} />
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
