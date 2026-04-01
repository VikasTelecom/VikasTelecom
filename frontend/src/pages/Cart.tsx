import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { useCart } from "@/contexts/CartContext";

const CartPage = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <CartDrawer />

      <main className="pt-0">
        <div className="container-main py-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold">Your Cart</h1>
            <span className="text-sm text-muted-foreground">{totalItems} item(s)</span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <ShoppingBag className="w-14 h-14 mx-auto text-muted-foreground/50 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">Add products to continue shopping.</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
              <section className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.lineId}
                    className="rounded-2xl border border-border bg-card p-4 flex gap-4"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.title}
                      className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg"
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2">{item.product.title}</h3>
                      {item.variant?.attributes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {[item.variant.attributes.color, item.variant.attributes.storage, item.variant.attributes.ram]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      <p className="font-bold text-primary mt-2">
                        ₹{(item.variant?.price ?? item.product.price).toLocaleString("en-IN")}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id ?? item.lineId, item.quantity - 1)}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id ?? item.lineId, item.quantity + 1)}
                            className="w-8 h-8 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id ?? item.lineId)}
                          className="inline-flex items-center gap-2 text-sm text-destructive hover:opacity-80"
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </section>

              <aside className="rounded-2xl border border-border bg-card p-5 h-fit lg:sticky lg:top-24">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Items ({totalItems})</span>
                    <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-green-600">Free</span>
                  </div>
                </div>
                <div className="border-t border-border my-4" />
                <div className="flex items-center justify-between text-base font-bold mb-4">
                  <span>Total</span>
                  <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                </div>

                <button
                  onClick={() => navigate("/checkout")}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary-hover transition-colors"
                >
                  Proceed to Checkout
                </button>
                <button
                  onClick={() => navigate("/orders")}
                  className="w-full mt-3 py-3 rounded-xl border border-border font-semibold hover:bg-muted transition-colors"
                >
                  View My Orders
                </button>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;
