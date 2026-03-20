type RequestOptions = RequestInit & { skipAuth?: boolean };

type ApiUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status?: "active" | "blocked";
  createdAt?: string;
};

type ApiProduct = {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  generalName?: string;
  slug?: string;
  image?: string;
  hoverImage?: string;
  price?: number;
  mrp?: number;
  discount?: number;
  rating?: number;
  reviewCount?: number;
  badge?: "sale" | "new" | "bestseller";
  stock?: number;
  status?: "active" | "draft" | "out_of_stock";
  category?: string;
  brand?: string;
  description?: string;
  images?: string[];
  specifications?: { feature: string; value: string }[];
  availability?: "In Stock" | "Out of Stock" | "Limited Stock";
  emi?: string;
  deliveryInfo?: string;
  returnPolicy?: string;
  reviews?: {
    id: string;
    user: string;
    avatar?: string;
    rating: number;
    date?: string;
    title?: string;
    comment?: string;
    helpful?: number;
  }[];
  ratingBreakdown?: { stars: number; count: number }[];
  variants?: {
    sku?: string;
    name?: string;
    image?: string;
    hoverImage?: string;
    price?: number;
    mrp?: number;
    discount?: number;
    stock?: number;
    attributes?: {
      color?: string;
      storage?: string;
      ram?: string;
      size?: string;
    };
    images?: string[];
    specifications?: { feature: string; value: string }[];
    status?: "active" | "draft" | "out_of_stock";
  }[];
  ram?: string;
  storage?: string;
  battery?: string;
  has5G?: boolean;
  type?: string;
  compatibility?: string;
  inStock?: boolean;
};

type ApiCategory = {
  id?: string;
  _id?: string;
  name?: string;
  title?: string;
  slug?: string;
  image?: string;
  productCount?: number;
  status?: "active" | "inactive";
  description?: string;
  items?: string[];
};

type ApiOrder = {
  _id?: string;
  id?: string;
  customerName?: string;
  email?: string;
  total?: number;
  status?: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentStatus?: "paid" | "unpaid" | "refunded";
  createdAt?: string;
  items?: { name: string; qty: number; price: number }[];
  address?: string;
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
};

type Paginated<T> = {
  items: T[];
  page: number;
  pages: number;
  total: number;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://vikastelecom.onrender.com/api";

const getToken = () => localStorage.getItem("auth_token");

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !options.skipAuth && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof data === "string" ? data : data?.message || res.statusText;
    throw new Error(message);
  }

  return data as T;
};

const normalizeProduct = (product: ApiProduct) => {
  return {
    id: product.id || product._id || "",
    title: product.title || product.name || "",
    generalName: product.generalName || "",
    slug: product.slug || "",
    image: product.image || "",
    hoverImage: product.hoverImage || product.image || "",
    price: product.price || 0,
    mrp: product.mrp || product.price || 0,
    discount: product.discount || 0,
    rating: product.rating || 0,
    reviewCount: product.reviewCount || 0,
    badge: product.badge,
    stock: product.stock || 0,
    status: product.status,
    category: product.category || "uncategorized",
    brand: product.brand,
    description: product.description,
    images: product.images,
    specifications: product.specifications,
    availability: product.availability,
    emi: product.emi,
    deliveryInfo: product.deliveryInfo,
    returnPolicy: product.returnPolicy,
    reviews: product.reviews,
    ratingBreakdown: product.ratingBreakdown,
    variants: product.variants,
    ram: product.ram,
    storage: product.storage,
    battery: product.battery,
    has5G: product.has5G,
    type: product.type,
    compatibility: product.compatibility,
    inStock: product.inStock,
  };
};

const normalizeCategory = (category: ApiCategory) => {
  return {
    id: category.id || category._id || "",
    title: category.title || category.name || "",
    slug: category.slug || "",
    image: category.image || "",
    productCount: category.productCount || 0,
    status: category.status,
    description: category.description,
    items: category.items || [],
  };
};

const buildQuery = (params?: Record<string, string | number | boolean | undefined>) => {
  if (!params) return "";
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    query.set(key, String(value));
  });

  const result = query.toString();
  return result ? `?${result}` : "";
};

export const api = {
  login: async (email: string, password: string) => {
    return apiRequest<{ user: ApiUser; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
  },
  register: async (name: string, email: string, password: string, phone?: string) => {
    return apiRequest<{ user: ApiUser; token: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, phone }),
      skipAuth: true,
    });
  },
  fetchMe: async () => {
    return apiRequest<{ user: ApiUser }>("/auth/me");
  },
  fetchProducts: async (params?: Record<string, string | number | boolean | undefined>) => {
    const data = await apiRequest<Paginated<ApiProduct>>(`/products${buildQuery(params)}`);
    return { ...data, items: data.items.map(normalizeProduct) };
  },

  // Coupons
  adminCreateCoupon: async (data: any) => {
    return apiRequest<any>("/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  adminListCoupons: async () => {
    return apiRequest<any[]>("/coupons");
  },
  adminDeleteCoupon: async (id: string) => {
    return apiRequest<any>(`/coupons/${id}`, {
      method: "DELETE",
    });
  },
  validateCoupon: async (code: string, cartTotal: number) => {
    return apiRequest<any>("/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, cartTotal }),
      skipAuth: true,
    });
  },
  fetchProduct: async (idOrSlug: string) => {
    const data = await apiRequest<{ product: ApiProduct }>(`/products/${idOrSlug}`);
    return normalizeProduct(data.product);
  },
  fetchCategories: async () => {
    const data = await apiRequest<{ items: ApiCategory[] }>("/categories");
    return data.items.map(normalizeCategory);
  },
  fetchBrands: async (category?: string) => {
    const url = category ? `/brands?category=${category}` : "/brands";
    const data = await apiRequest<{ items: any[] }>(url);
    return data.items;
  },
  fetchBrand: async (slugOrId: string) => {
    const data = await apiRequest<{ brand: any }>(`/brands/${slugOrId}`);
    return data.brand;
  },
  adminListProducts: async (params?: Record<string, string | number | boolean | undefined>) => {
    return api.fetchProducts(params);
  },
  adminCreateProduct: async (payload: Record<string, unknown>) => {
    const data = await apiRequest<{ product: ApiProduct }>("/products", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeProduct(data.product);
  },
  adminUpdateProduct: async (id: string, payload: Record<string, unknown>) => {
    const data = await apiRequest<{ product: ApiProduct }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return normalizeProduct(data.product);
  },
  adminDeleteProduct: async (id: string) => {
    const data = await apiRequest<{ message: string }>(`/products/${id}`, {
      method: "DELETE",
    });
    return data.message;
  },
  adminListCategories: async () => {
    return api.fetchCategories();
  },
  adminCreateCategory: async (payload: Record<string, unknown>) => {
    const data = await apiRequest<{ category: ApiCategory }>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeCategory(data.category);
  },
  adminUpdateCategory: async (id: string, payload: Record<string, unknown>) => {
    const data = await apiRequest<{ category: ApiCategory }>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return normalizeCategory(data.category);
  },
  adminDeleteCategory: async (id: string) => {
    const data = await apiRequest<{ message: string }>(`/categories/${id}`, { method: "DELETE" });
    return data.message;
  },
  adminListBrands: async (category?: string) => {
    const url = category ? `/brands?category=${category}` : "/brands";
    const data = await apiRequest<{ items: any[] }>(url);
    return data.items;
  },
  adminCreateBrand: async (payload: Record<string, unknown>) => {
    const data = await apiRequest<{ brand: any }>("/brands", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.brand;
  },
  adminUpdateBrand: async (id: string, payload: Record<string, unknown>) => {
    const data = await apiRequest<{ brand: any }>(`/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return data.brand;
  },
  adminDeleteBrand: async (id: string) => {
    const data = await apiRequest<{ message: string }>(`/brands/${id}`, { method: "DELETE" });
    return data.message;
  },
  adminListOrders: async () => {
    const data = await apiRequest<{ items: ApiOrder[] }>("/orders");
    return data.items;
  },
  adminUpdateOrderStatus: async (id: string, payload: Record<string, unknown>) => {
    const data = await apiRequest<{ order: ApiOrder }>(`/orders/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return data.order;
  },
  adminDeleteOrder: async (id: string) => {
    const data = await apiRequest<{ message: string }>(`/orders/${id}`, { method: "DELETE" });
    return data.message;
  },
  adminListUsers: async () => {
    const data = await apiRequest<{ items: ApiUser[] }>("/users");
    return data.items;
  },
  adminUpdateUser: async (id: string, payload: Record<string, unknown>) => {
    const data = await apiRequest<{ user: ApiUser }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return data.user;
  },
  getCart: async () => {
    const data = await apiRequest<{ cart: { items: unknown[] } }>("/cart");
    return data.cart;
  },
  addCartItem: async (productId: string, quantity = 1, variant?: unknown) => {
    const data = await apiRequest<{ cart: { items: unknown[] } }>("/cart/items", {
      method: "POST",
      body: JSON.stringify({ productId, quantity, variant }),
    });
    return data.cart;
  },
  updateCartItem: async (itemId: string, quantity: number) => {
    const data = await apiRequest<{ cart: { items: unknown[] } }>(`/cart/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity }),
    });
    return data.cart;
  },
  removeCartItem: async (itemId: string) => {
    const data = await apiRequest<{ cart: { items: unknown[] } }>(`/cart/items/${itemId}`, {
      method: "DELETE",
    });
    return data.cart;
  },
  clearCart: async () => {
    const data = await apiRequest<{ cart: { items: unknown[] } }>("/cart/clear", { method: "DELETE" });
    return data.cart;
  },
  listAddresses: async () => {
    const data = await apiRequest<{ items: unknown[] }>("/addresses");
    return data.items;
  },
  createAddress: async (payload: Record<string, unknown>) => {
    const data = await apiRequest<{ address: unknown }>("/addresses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.address;
  },
  updateAddress: async (id: string, payload: Record<string, unknown>) => {
    const data = await apiRequest<{ address: unknown }>(`/addresses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return data.address;
  },
  deleteAddress: async (id: string) => {
    const data = await apiRequest<{ message: string }>(`/addresses/${id}`, { method: "DELETE" });
    return data.message;
  },
  createOrder: async (payload: Record<string, unknown>) => {
    const data = await apiRequest<{ order: ApiOrder }>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return data.order;
  },
  listMyOrders: async () => {
    const data = await apiRequest<{ items: ApiOrder[] }>("/orders/me");
    return data.items;
  },
  fetchAdminAnalytics: async () => {
    return apiRequest<{ stats: unknown; salesData: unknown[]; recentOrders: unknown[]; categorySales: unknown[]; topProducts: unknown[] }>("/admin/analytics");
  },
};
