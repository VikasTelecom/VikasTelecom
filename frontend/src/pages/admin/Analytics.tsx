import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, ShoppingCart, Users, IndianRupee, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { api } from "@/lib/api";

const PIE_COLORS = ["#f97316", "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

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

type CategorySalesPoint = {
    category: string;
    sales: number;
    units: number;
};

type TopProduct = {
    name: string;
    revenue: number;
    units: number;
    growth: number;
};

export default function Analytics() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [salesData, setSalesData] = useState<SalesPoint[]>([]);
    const [categorySales, setCategorySales] = useState<CategorySalesPoint[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setIsLoading(true);
                setLoadError("");
                const data = await api.fetchAdminAnalytics();
                setStats((data.stats || null) as DashboardStats | null);
                setSalesData((data.salesData || []) as SalesPoint[]);
                setCategorySales((data.categorySales || []) as CategorySalesPoint[]);
                setTopProducts((data.topProducts || []) as TopProduct[]);
            } catch {
                setLoadError("Failed to load analytics");
            } finally {
                setIsLoading(false);
            }
        };

        load();
    }, []);

    const kpis = [
        {
            label: "Total Revenue",
            value: `₹${((stats?.totalRevenue || 0) / 1000).toFixed(1)}K`,
            icon: IndianRupee,
            bg: "bg-orange-50",
            iconColor: "text-orange-500",
        },
        {
            label: "Total Orders",
            value: (stats?.totalOrders || 0).toString(),
            icon: ShoppingCart,
            bg: "bg-blue-50",
            iconColor: "text-blue-500",
        },
        {
            label: "Total Users",
            value: (stats?.totalUsers || 0).toString(),
            icon: Users,
            bg: "bg-purple-50",
            iconColor: "text-purple-500",
        },
        {
            label: "Total Products",
            value: (stats?.totalProducts || 0).toString(),
            icon: Package,
            bg: "bg-green-50",
            iconColor: "text-green-500",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Track your store's performance</p>
                    {loadError && <p className="text-sm text-red-500 mt-1">{loadError}</p>}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.label} className="border-0 shadow-sm">
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                                    <p className="text-2xl font-bold mt-1">{isLoading ? "..." : kpi.value}</p>
                                </div>
                                <div className={`w-11 h-11 rounded-xl ${kpi.bg} flex items-center justify-center`}>
                                    <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Revenue Chart */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Revenue & Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">Loading analytics...</div>
                    ) : salesData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No revenue data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <AreaChart data={salesData}>
                                <defs>
                                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                                    formatter={(value: number, name: string) => [name === "revenue" ? `₹${value.toLocaleString()}` : value, name === "revenue" ? "Revenue" : "Orders"]}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#f97316" fill="url(#revGrad)" strokeWidth={2.5} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Category Sales + Top Products */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Category Sales Pie */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Sales by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Loading category sales...</div>
                        ) : categorySales.length === 0 ? (
                            <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No category sales data available</div>
                        ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <ResponsiveContainer width={220} height={220}>
                                <PieChart>
                                    <Pie data={categorySales} dataKey="sales" nameKey="category" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                                        {categorySales.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="space-y-2 flex-1">
                                {categorySales.map((cat, i) => (
                                    <div key={cat.category} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                            <span className="text-muted-foreground">{cat.category}</span>
                                        </div>
                                        <span className="font-semibold">₹{(cat.sales / 1000).toFixed(1)}K</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>

                {/* Category Units Bar */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Units Sold by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">Loading units data...</div>
                        ) : categorySales.length === 0 ? (
                            <div className="h-[240px] flex items-center justify-center text-sm text-muted-foreground">No units data available</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={categorySales} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
                                    <Tooltip formatter={(v: number) => [`${v} units`, "Units"]} />
                                    <Bar dataKey="units" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                        {categorySales.map((_, i) => (
                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Top Products Table */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Top Performing Products</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40">
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">#</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Product</th>
                                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Revenue</th>
                                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Units</th>
                                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Growth</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading top products...</td>
                                    </tr>
                                )}
                                {!isLoading && topProducts.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No top products data available</td>
                                    </tr>
                                )}
                                {!isLoading && topProducts.map((p, i) => (
                                    <tr key={p.name} className="border-b last:border-0 hover:bg-muted/20">
                                        <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                                        <td className="px-4 py-3 font-medium">{p.name}</td>
                                        <td className="px-4 py-3 text-right font-semibold">₹{p.revenue.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-right">{p.units}</td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`inline-flex items-center gap-1 font-semibold ${p.growth >= 0 ? "text-green-600" : "text-red-500"}`}>
                                                {p.growth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                                {Math.abs(p.growth)}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
