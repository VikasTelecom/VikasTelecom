import { useEffect, useState } from "react";
import { ClipboardList, Eye, Phone, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [selectedOrder, setSelectedOrder] = useState<CounterOrder | null>(null);
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
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell><Badge variant="outline">Counter</Badge></TableCell>
                    <TableCell>{order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="capitalize">{order.status || "pending"}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && orders.length === 0 && (
                  <TableRow><TableCell colSpan={9} className="py-12 text-center text-gray-500">No counter orders yet.</TableCell></TableRow>
                )}
                {loading && <TableRow><TableCell colSpan={9} className="py-12 text-center text-gray-500">Loading counter orders…</TableCell></TableRow>}
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <Badge variant="outline">Counter</Badge>
                </div>
                <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedOrder(order)}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </Button>
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

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Counter Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold">Customer</h3>
                  <p>{selectedOrder.customerName || "—"}</p>
                  <p>{selectedOrder.customerPhone || selectedOrder.shippingAddress?.phone || "—"}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Order</h3>
                  <p className="font-mono text-sm">{selectedOrder._id || selectedOrder.id || "—"}</p>
                  <p>{selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "—"}</p>
                  <div className="flex items-center gap-2">
                    <span>Payment Method</span><Badge variant="outline">Counter</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Status</span><Badge variant="outline" className="capitalize">{selectedOrder.status || "pending"}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-semibold">Products</h3>
                {(selectedOrder.items || []).map((item, index) => (
                  <div key={`${item.productId || item.name}-${index}`} className="rounded-lg border p-3">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{item.name} × {item.qty}</span>
                      <span>₹{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                    {getVariantLabel(item.variant) && <p className="mt-1 text-sm text-muted-foreground">{getVariantLabel(item.variant)}</p>}
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t pt-3 font-semibold">
                <span>Total</span><span>₹{(selectedOrder.total || 0).toLocaleString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}