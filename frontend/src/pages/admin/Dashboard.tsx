import { useEffect, useMemo, useState } from "react";
import { Package, ShoppingCart, IndianRupee, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { api } from "@/lib/api";

const statusColor: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

type DashboardStats = {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
};

type SalesPoint = {
  day: string;
  revenue: number;
  orders: number;
};

type RecentOrder = {
  _id?: string;
  id?: string;
  customerName?: string;
  total?: number;
  status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        const data = await api.fetchAdminAnalytics();
        setStats((data.stats || null) as DashboardStats | null);
        setSales((data.salesData || []) as SalesPoint[]);
        setRecentOrders((data.recentOrders || []).slice(0, 5) as RecentOrder[]);
      } catch {
        setLoadError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const statCards = useMemo(() => ([
    { label: "Total Products", value: stats?.totalProducts ?? 0, icon: Package, format: (v: number) => v.toString() },
    { label: "Total Orders", value: stats?.totalOrders ?? 0, icon: ShoppingCart, format: (v: number) => v.toString() },
    { label: "Total Revenue", value: stats?.totalRevenue ?? 0, icon: IndianRupee, format: (v: number) => `₹${(v / 1000).toFixed(1)}K` },
    { label: "Total Users", value: stats?.totalUsers ?? 0, icon: Users, format: (v: number) => v.toString() },
  ]), [stats]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {loadError && <p className="text-sm text-red-500 mt-1">{loadError}</p>}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-l-4 border-l-primary">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{isLoading ? "..." : stat.format(stat.value)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart + Recent Orders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sales (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Loading dashboard data...</div>
            ) : sales.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No sales data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                    formatter={(value: number) => [`₹${value}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(29, 100%, 50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">Loading recent orders...</TableCell>
                  </TableRow>
                )}
                {!isLoading && recentOrders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No recent orders found</TableCell>
                  </TableRow>
                )}
                {!isLoading && recentOrders.map((order) => {
                  const orderId = order.id || order._id || "-";
                  const customer = order.customerName || "-";
                  const total = order.total || 0;
                  const status = order.status || "pending";

                  return (
                    <TableRow key={orderId}>
                      <TableCell className="font-medium">{orderId}</TableCell>
                      <TableCell>{customer}</TableCell>
                      <TableCell>₹{total.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColor[status]}`}>
                          {status}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
