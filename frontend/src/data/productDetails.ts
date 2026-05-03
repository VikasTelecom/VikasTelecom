import { Product, ProductVariant } from "./products";
import { audioProducts } from "./audioProducts";
import { chargingProducts } from "./chargingProducts";
import { smartDevicesProducts } from "./smartDevicesProducts";
import { accessoriesProducts } from "./accessoriesProducts";
import { mobileProducts } from "./mobileProducts";
import { mobileAccessoriesProducts } from "./mobileAccessoriesProducts";

export interface ProductDetail extends Product {
  brand: string;
  description: string;
  images: string[];
  specifications: { feature: string; value: string }[];
  availability: "In Stock" | "Out of Stock" | "Limited Stock";
  emi?: string;
  deliveryInfo: string;
  returnPolicy: string;
  reviews: ProductReview[];
  ratingBreakdown: { stars: number; count: number }[];
  variants?: ProductVariant[];
}

export interface ProductReview {
  id: string;
  user: string;
  userName?: string;
  avatar: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  helpful: number;
}

// Combine all products into one searchable array
export const allProducts: Product[] = [
  ...audioProducts,
  ...chargingProducts,
  ...smartDevicesProducts,
  ...accessoriesProducts,
  ...mobileProducts,
  ...mobileAccessoriesProducts,
];

// Generate detailed info for any product
export function getProductDetail(id: string): ProductDetail | undefined {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return undefined;

  const brandMap: Record<string, string> = {
    speakers: "SoundDrum",
    earbuds: "Harmonics",
    headphones: "Muffs",
    neckbands: "Pure Sound",
    soundbars: "SoundBar",
    "wireless-chargers": "PowerCharge",
    "car-chargers": "Adapto",
    "wall-chargers": "iBlitz",
    "power-banks": "PowerBank",
    cables: "CablePro",
    smartwatches: "Konnect",
    "smart-plugs": "SmartPlug",
    "led-lamps": "LED Pro",
    webcams: "HD Pro",
    "phone-holders": "GripMount",
    "laptop-stands": "ErgoStand",
    "usb-hubs": "USB Pro",
    "mouse-keyboards": "MechKey",
    mobiles: "TechMobile",
    "mobile-accessories": "AccPro",
  };

  const specMap: Record<string, { feature: string; value: string }[]> = {
    speakers: [
      { feature: "Driver Size", value: "52mm" },
      { feature: "Bluetooth", value: "5.3" },
      { feature: "Battery Life", value: "10 hours" },
      { feature: "Water Resistance", value: "IPX5" },
      { feature: "Weight", value: "450g" },
      { feature: "Warranty", value: "1 Year" },
    ],
    earbuds: [
      { feature: "Driver Size", value: "10mm" },
      { feature: "Bluetooth", value: "5.3" },
      { feature: "Battery Life", value: "8 hours (28 total)" },
      { feature: "ANC", value: "Yes" },
      { feature: "Weight", value: "4.5g per bud" },
      { feature: "Warranty", value: "1 Year" },
    ],
    headphones: [
      { feature: "Driver Size", value: "40mm" },
      { feature: "Bluetooth", value: "5.2" },
      { feature: "Battery Life", value: "30 hours" },
      { feature: "ANC", value: "Hybrid ANC" },
      { feature: "Weight", value: "250g" },
      { feature: "Warranty", value: "1 Year" },
    ],
    neckbands: [
      { feature: "Driver Size", value: "12mm" },
      { feature: "Bluetooth", value: "5.0" },
      { feature: "Battery Life", value: "20 hours" },
      { feature: "Water Resistance", value: "IPX4" },
      { feature: "Weight", value: "30g" },
      { feature: "Warranty", value: "1 Year" },
    ],
    soundbars: [
      { feature: "Output Power", value: "80W" },
      { feature: "Channels", value: "2.1" },
      { feature: "Bluetooth", value: "5.0" },
      { feature: "Connectivity", value: "HDMI ARC, Optical, AUX" },
      { feature: "Subwoofer", value: "Wireless" },
      { feature: "Warranty", value: "1 Year" },
    ],
    default: [
      { feature: "Connectivity", value: "USB-C / Bluetooth" },
      { feature: "Compatibility", value: "Universal" },
      { feature: "Material", value: "ABS + Aluminum" },
      { feature: "Weight", value: "150g" },
      { feature: "Cable Length", value: "1.5m" },
      { feature: "Warranty", value: "1 Year" },
    ],
  };

  const sampleReviews: ProductReview[] = [];

  const totalReviews = product.reviewCount;
  const ratingBreakdown = [
    { stars: 5, count: Math.round(totalReviews * 0.45) },
    { stars: 4, count: Math.round(totalReviews * 0.28) },
    { stars: 3, count: Math.round(totalReviews * 0.15) },
    { stars: 2, count: Math.round(totalReviews * 0.08) },
    { stars: 1, count: Math.round(totalReviews * 0.04) },
  ];

  return {
    ...product,
    brand: brandMap[product.category] || "TechBrand",
    description: `Experience premium quality with the ${product.title}. Designed for modern lifestyle, this product combines cutting-edge technology with elegant design. Perfect for daily use, it delivers exceptional performance that will elevate your experience. Built with high-quality materials and backed by our satisfaction guarantee.`,
    images: [
      product.image.replace("w=400&h=400", "w=800&h=800"),
      product.hoverImage.replace("w=400&h=400", "w=800&h=800"),
      product.image.replace("w=400&h=400", "w=800&h=800") + "&q=90",
      product.hoverImage.replace("w=400&h=400", "w=800&h=800") + "&q=90",
    ],
    specifications: specMap[product.category] || specMap.default,
    availability: "In Stock",
    emi: product.price > 1000 ? `EMI from ₹${Math.round(product.price / 6)}/month` : undefined,
    deliveryInfo: "Free delivery by Feb 20-22. Order within 6 hrs.",
    returnPolicy: "Replacement only for defective products within 7 days.",
    reviews: sampleReviews,
    ratingBreakdown,
  };
}

export function getRelatedProducts(id: string, limit = 8): Product[] {
  const product = allProducts.find((p) => p.id === id);
  if (!product) return allProducts.slice(0, limit);
  return allProducts
    .filter((p) => p.id !== id && p.category === product.category)
    .concat(allProducts.filter((p) => p.id !== id && p.category !== product.category))
    .slice(0, limit);
}
