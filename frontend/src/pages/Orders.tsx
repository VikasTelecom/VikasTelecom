import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

type UserOrder = {
  _id?: string;
  id?: string;
  createdAt?: string;
  status?: string;
  paymentStatus?: string;
  total?: number;
  customerName?: string;
  shippingAddress?: {
    name?: string;
    phone?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  items?: { product?: string; productId?: string; name: string; qty: number; price: number; image?: string }[];
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const paymentStatusStyles: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-800",
  unpaid: "bg-orange-100 text-orange-800",
  refunded: "bg-slate-100 text-slate-800",
};

const OrdersPage = () => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const [rateDialogOpen, setRateDialogOpen] = useState(false);
  const [rateProductId, setRateProductId] = useState<string>("");
  const [rateProductName, setRateProductName] = useState<string>("");
  const [rateValue, setRateValue] = useState<number>(0);
  const [rateTitle, setRateTitle] = useState<string>("");
  const [rateComment, setRateComment] = useState<string>("");
  const [rateSubmitting, setRateSubmitting] = useState(false);
  const [ratedProductIds, setRatedProductIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }

    api
      .listMyOrders()
      .then((data) => setOrders((data || []) as UserOrder[]))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const openRateDialog = (productId: string, productName: string) => {
    setRateProductId(productId);
    setRateProductName(productName);
    setRateValue(0);
    setRateTitle("");
    setRateComment("");
    setRateDialogOpen(true);
  };

  const submitRating = async () => {
    if (!rateProductId) return;
    if (rateValue < 1 || rateValue > 5) {
      toast({ title: "Select a rating", description: "Please choose 1 to 5 stars.", variant: "destructive" });
      return;
    }

    try {
      setRateSubmitting(true);
      await api.addProductReview(rateProductId, {
        rating: rateValue,
        title: rateTitle.trim() || undefined,
        comment: rateComment.trim() || undefined,
      });
      setRatedProductIds((prev) => ({ ...prev, [rateProductId]: true }));
      toast({ title: "Thanks for your rating!" });
      setRateDialogOpen(false);
    } catch (error) {
      toast({ title: "Failed to submit rating", description: (error as Error).message, variant: "destructive" });
    } finally {
      setRateSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <CartDrawer />

      <main className="pt-20">
        <div className="container-main py-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold">My Orders</h1>
            <Link to="/cart" className="text-sm text-primary hover:underline">
              Go to Cart
            </Link>
          </div>

          {!isAuthenticated ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">Please log in</h2>
              <p className="text-muted-foreground mb-6">You need an account to view your order history.</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors"
              >
                Log In
              </Link>
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              Loading your orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">Once you place an order, it will appear here.</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const orderId = order.id || order._id || "-";
                const date = order.createdAt ? new Date(order.createdAt) : null;
                const status = (order.status || "pending").toLowerCase();
                const isDelivered = status === "delivered";
                const statusClass = statusStyles[status] || "bg-muted text-foreground";
                const paymentStatus = (order.paymentStatus || "unpaid").toLowerCase();
                const paymentStatusClass = paymentStatusStyles[paymentStatus] || "bg-muted text-foreground";
                const address = order.shippingAddress;

                return (
                  <div key={orderId} className="rounded-2xl border border-border bg-card p-4 md:p-5">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-xs text-muted-foreground">Order ID</p>
                        <p className="font-semibold">{orderId}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {date ? date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${statusClass}`}>
                          {status}
                        </span>
                        <div className="mt-2">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${paymentStatusClass}`}>
                            Payment: {paymentStatus}
                          </span>
                        </div>
                        <p className="font-bold mt-2">₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items</p>
                        {order.items.map((item, idx) => (
                          <div key={`${orderId}-${idx}`} className="flex items-start justify-between gap-3 text-sm rounded-lg border border-border/70 p-3">
                            <div className="min-w-0">
                              <p className="text-foreground font-medium break-words">{item.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">Qty: {item.qty}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <p className="font-semibold whitespace-nowrap">₹{Number(item.price || 0).toLocaleString("en-IN")}</p>
                              {isDelivered && (() => {
                                const productId = String(item.productId || item.product || "");
                                if (!productId) return null;
                                if (ratedProductIds[productId]) {
                                  return <span className="text-xs text-muted-foreground">Rated</span>;
                                }
                                return (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openRateDialog(productId, item.name)}
                                  >
                                    Rate
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {address && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Delivery address</p>
                        <div className="rounded-lg border border-border/70 p-3 text-sm">
                          <p className="font-medium">{address.name || order.customerName || "Customer"}</p>
                          {address.phone ? <p className="text-muted-foreground">{address.phone}</p> : null}
                          <p className="text-muted-foreground mt-1">
                            {[address.line1, address.line2].filter(Boolean).join(", ")}
                          </p>
                          <p className="text-muted-foreground">
                            {[address.city, address.state, address.postalCode, address.country].filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog
        open={rateDialogOpen}
        onOpenChange={(open) => {
          if (!open && !rateSubmitting) setRateDialogOpen(false);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rate product</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">{rateProductName}</div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRateValue(value)}
                    className={`h-9 w-9 rounded-md border border-border text-lg ${
                      rateValue >= value ? "bg-primary text-primary-foreground" : "bg-background"
                    }`}
                    aria-label={`${value} star`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewTitle">Title (optional)</Label>
              <Input id="reviewTitle" value={rateTitle} onChange={(e) => setRateTitle(e.target.value)} placeholder="Short summary" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewComment">Comment (optional)</Label>
              <Textarea
                id="reviewComment"
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
                placeholder="Share your experience"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRateDialogOpen(false)} disabled={rateSubmitting}>
                Cancel
              </Button>
              <Button onClick={submitRating} disabled={rateSubmitting}>
                {rateSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default OrdersPage;
