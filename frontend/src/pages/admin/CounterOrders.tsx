import { useEffect, useState } from "react";
import { ClipboardList, Phone, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

type CounterOrder = Awaited<ReturnType<typeof api.adminListOrders>>[number];

const getVariantLabel = (variant: unknown) => {
  if (!variant) return "";
  if (typeof variant === "string") return variant;
  if (typeof variant !== "object") return "";
  const value = variant as { name?: string; attributes?: Record<string, string | undefined> };
  const attrs = value.attributes || {};
  return [value.name, attrs.color, attrs.storage, attrs.ram, attrs.size].filter(Boolean).join(" · ");
};

export default function CounterOrders() {
  const [orders, setOrders] = useState<CounterOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const allOrders = await api.adminListOrders();
      setOrders(allOrders.filter((order) => order.fulfillmentType === "counter"));
    } catch (error) {
      toast({ title: "Failed to load counter orders", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Counter Orders</h1>
          <p className="mt-1 text-gray-500">Orders placed online for collection at the shop.</p>
        </div>
        <Button variant="outline" onClick={() => void loadOrders()} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Product details</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id || order.id}>
                    <TableCell className="font-mono text-xs">{(order._id || order.id || "").slice(-8)}</TableCell>
                    <TableCell className="font-medium">{order.customerName || "—"}</TableCell>
                    <TableCell>
                      <a className="inline-flex items-center gap-1 text-blue-700 hover:underline" href={`tel:${order.customerPhone || order.shippingAddress?.phone || ""}`}>
                        <Phone className="h-3.5 w-3.5" /> {order.customerPhone || order.shippingAddress?.phone || "—"}
                      </a>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {(order.items || []).map((item, index) => (
                          <div key={`${item.productId || item.name}-${index}`}>
                            <span className="font-medium">{item.name}</span>
                            <span className="text-gray-500"> × {item.qty}</span>
                            {getVariantLabel(item.variant) && <div className="text-xs text-gray-500">{getVariantLabel(item.variant)}</div>}
                          </div>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">₹{(order.total || 0).toLocaleString()}</TableCell>
                    <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{order.status || "pending"}</Badge></TableCell>
                  </TableRow>
                ))}
                {!loading && orders.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="py-12 text-center text-gray-500">No counter orders yet.</TableCell></TableRow>
                )}
                {loading && <TableRow><TableCell colSpan={7} className="py-12 text-center text-gray-500">Loading counter orders…</TableCell></TableRow>}
              </TableBody>
            </Table>
          </div>

          <div className="divide-y md:hidden">
            {orders.map((order) => (
              <div key={order._id || order.id} className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{order.customerName || "—"}</p>
                    <a className="mt-1 inline-flex items-center gap-1 text-sm text-blue-700" href={`tel:${order.customerPhone || order.shippingAddress?.phone || ""}`}>
                      <Phone className="h-3.5 w-3.5" /> {order.customerPhone || order.shippingAddress?.phone || "—"}
                    </a>
                  </div>
                  <Badge variant="outline" className="capitalize">{order.status || "pending"}</Badge>
                </div>
                <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
                  {(order.items || []).map((item, index) => (
                    <div key={`${item.productId || item.name}-${index}`}>
                      <p className="font-medium">{item.name} × {item.qty}</p>
                      {getVariantLabel(item.variant) && <p className="text-xs text-muted-foreground">{getVariantLabel(item.variant)}</p>}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</span>
                  <span className="font-semibold">₹{(order.total || 0).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {!loading && orders.length === 0 && (
              <div className="flex flex-col items-center gap-2 p-10 text-center text-gray-500">
                <ClipboardList className="h-8 w-8" />
                <p>No counter orders yet.</p>
              </div>
            )}
            {loading && <p className="p-10 text-center text-gray-500">Loading counter orders…</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}