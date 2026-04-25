import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

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
  items?: { name: string; qty: number; price: number }[];
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
                            <p className="font-semibold whitespace-nowrap">₹{Number(item.price || 0).toLocaleString("en-IN")}</p>
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

      <Footer />
    </div>
  );
};

export default OrdersPage;
