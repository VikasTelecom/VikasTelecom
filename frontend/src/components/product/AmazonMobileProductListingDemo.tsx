import type { Product } from "@/data/products";
import { AmazonMobileProductCard } from "./AmazonMobileProductCard";

const demoPhones: Product[] = [
  {
    id: "demo-1",
    title: "iQOO 15 (Legend, 12GB RAM, 256GB Storage)",
    generalName: "iQOO 15 (12GB/256GB)",
    price: 17999,
    mrp: 23999,
    discount: 25,
    image: "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=600&fit=crop",
    category: "mobiles",
    rating: 4.3,
    reviewCount: 2218,
  },
  {
    id: "demo-2",
    title: "realme NARZO 80 Pro 5G (Speed Silver, 8GB+128GB)",
    generalName: "realme NARZO 80 Pro 5G",
    price: 12999,
    mrp: 16999,
    discount: 24,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop",
    category: "mobiles",
    rating: 4.2,
    reviewCount: 565,
  },
  {
    id: "demo-3",
    title: "Samsung Galaxy A55 5G (Awesome Navy, 8GB RAM, 128GB Storage)",
    generalName: "Samsung Galaxy A55 5G",
    price: 24999,
    mrp: 29999,
    discount: 17,
    image: "https://images.unsplash.com/photo-1601972599720-b3d39817a0b1?w=600&h=600&fit=crop",
    category: "mobiles",
    rating: 4.1,
    reviewCount: 802,
  },
  {
    id: "demo-4",
    title: "Apple iPhone 15 (Blue, 128 GB)",
    generalName: "iPhone 15 (128GB)",
    price: 62999,
    mrp: 69999,
    discount: 10,
    image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=600&fit=crop",
    category: "mobiles",
    rating: 4.6,
    reviewCount: 1534,
  },
];

export function AmazonMobileProductListingDemo() {
  return (
    <div className="bg-muted/30">
      <div className="px-3 py-4">
        <div className="grid grid-cols-2 gap-3">
          {demoPhones.map((p) => (
            <AmazonMobileProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
