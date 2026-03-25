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
  items?: { name: string; qty: number; price: number }[];
};

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
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
                        <p className="font-bold mt-2">₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={`${orderId}-${idx}`} className="flex items-center justify-between text-sm">
                            <p className="text-foreground line-clamp-1 pr-2">{item.name} x {item.qty}</p>
                            <p className="font-medium">₹{Number(item.price || 0).toLocaleString("en-IN")}</p>
                          </div>
                        ))}
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
