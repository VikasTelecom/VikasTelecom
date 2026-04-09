import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Product, ProductVariant } from "@/data/products";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export interface CartItem {
  id?: string;
  lineId: string;
  product: Product;
  quantity: number;
  variant?: ProductVariant;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, variant?: ProductVariant) => void;
  removeFromCart: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const getVariantKey = (variant?: ProductVariant) => {
    if (!variant) return "base";
    return JSON.stringify({
      sku: variant.sku,
      name: variant.name,
      attributes: variant.attributes,
    });
  };

  const mapServerCart = (cart: { items?: any[] }) => {
    const mapped = (cart.items || []).map((item) => ({
      id: item._id || item.id,
      lineId: item._id || item.id || `${item.productId || item.product || ""}:${getVariantKey(item.variant)}`,
      quantity: item.quantity,
      product: {
        id: item.productId || item.product || "",
        title: item.name || "",
        slug: "",
        image: item.image || "",
        hoverImage: item.image || "",
        price: item.price || 0,
        mrp: item.price || 0,
        discount: 0,
        rating: 0,
        reviewCount: 0,
        category: item.category || "",
      },
      variant: item.variant,
    }));

    setItems(mapped);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    api.getCart()
      .then(mapServerCart)
      .catch(() => {});
  }, [isAuthenticated]);

  const addToCart = useCallback((product: Product, variant?: ProductVariant) => {
    if (isAuthenticated) {
      api.addCartItem(product.id, 1, variant)
        .then(mapServerCart)
        .catch(() => {});
      setIsCartOpen(true);
      return;
    }

    const variantKey = getVariantKey(variant);
    const lineId = `${product.id}:${variantKey}`;
    setItems((prev) => {
      const existing = prev.find((item) => item.lineId === lineId);
      if (existing) {
        return prev.map((item) =>
          item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { lineId, product, quantity: 1, variant }];
    });
    setIsCartOpen(true);
  }, [isAuthenticated]);

  const removeFromCart = useCallback((lineId: string) => {
    if (isAuthenticated) {
      const item = items.find((entry) => entry.id === lineId || entry.lineId === lineId);
      if (!item) return;

      if (!item.id) {
        setItems((prev) => prev.filter((entry) => entry.lineId !== item.lineId));
        return;
      }

      api.removeCartItem(item.id)
        .then(mapServerCart)
        .catch(() => {
          setItems((prev) => prev.filter((entry) => entry.lineId !== item.lineId));
        });
      return;
    }
    setItems((prev) => prev.filter((item) => item.lineId !== lineId));
  }, [isAuthenticated, items]);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    if (isAuthenticated) {
      const item = items.find((entry) => entry.id === lineId || entry.lineId === lineId);
      if (!item) return;

      if (quantity <= 0) {
        removeFromCart(item.id ?? item.lineId);
        return;
      }

      if (!item.id) {
        setItems((prev) =>
          prev.map((entry) =>
            entry.lineId === item.lineId ? { ...entry, quantity } : entry
          )
        );
        return;
      }

      api.updateCartItem(item.id, quantity)
        .then(mapServerCart)
        .catch(() => {
          setItems((prev) =>
            prev.map((entry) =>
              entry.lineId === item.lineId ? { ...entry, quantity } : entry
            )
          );
        });
      return;
    }

    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.lineId !== lineId));
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.lineId === lineId ? { ...item, quantity } : item))
    );
  }, [isAuthenticated, items]);

  const clearCart = useCallback(() => {
    if (isAuthenticated) {
      api.clearCart()
        .then(mapServerCart)
        .catch(() => {});
      return;
    }
    setItems([]);
  }, [isAuthenticated]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.variant?.price ?? item.product.price) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice, isCartOpen, setIsCartOpen }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
