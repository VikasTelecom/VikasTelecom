export interface ProductVariant {
  sku?: string;
  name?: string;
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
  status?: "active" | "draft" | "out_of_stock";
}

export interface Product {
  id: string;
  title: string;
  generalName?: string;
  slug: string;
  image: string;
  hoverImage: string;
  price: number;
  mrp: number;
  discount: number;
  rating: number;
  reviewCount: number;
  badge?: "sale" | "new" | "bestseller";
  category: string;
  brand?: string;
  variants?: ProductVariant[];
}

export const products: Product[] = [];

export const bestSellers = products.filter(p => p.badge === "bestseller" || p.rating >= 4.5);
export const newArrivals = products.filter(p => p.badge === "new" || p.discount >= 55);
