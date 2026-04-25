import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

type OrderSummary = {
  id: string;
  items: {
    name: string;
    qty: number;
    price: number;
    image?: string;
    variant?: {
      name?: string;
      attributes?: {
        color?: string;
        storage?: string;
        ram?: string;
        size?: string;
      };
    };
  }[];
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  paymentMethod: string;
  address?: {
    name: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
  placedAt?: string;
};

const CheckoutSuccess = () => {
  const orderSummary = useMemo<OrderSummary | null>(() => {
    try {
      const raw = localStorage.getItem("last_order");
      return raw ? (JSON.parse(raw) as OrderSummary) : null;
    } catch {
      return null;
    }
  }, []);

  const handleDownloadInvoice = () => {
    if (!orderSummary) return;
    const formatVariant = (item: OrderSummary["items"][number]) => {
      const attrs = item.variant?.attributes || {};
      return [
        item.variant?.name,
        attrs.color,
        attrs.storage && `${attrs.storage} Storage`,
        attrs.ram && `${attrs.ram} RAM`,
        attrs.size,
      ]
        .filter(Boolean)
        .join(" · ");
    };

    const rows = orderSummary.items
      .map((item) => {
        const variant = formatVariant(item);
        return `
          <tr>
            <td style="padding:8px 0;">${item.name}${variant ? ` <div style=\"color:#6b7280;font-size:12px;\">${variant}</div>` : ""}</td>
            <td style="padding:8px 0;text-align:center;">${item.qty}</td>
            <td style="padding:8px 0;text-align:right;">₹${item.price.toLocaleString()}</td>
            <td style="padding:8px 0;text-align:right;">₹${(item.price * item.qty).toLocaleString()}</td>
          </tr>
        `;
      })
      .join("");

    const address = orderSummary.address
      ? `${orderSummary.address.line1}${orderSummary.address.line2 ? `, ${orderSummary.address.line2}` : ""}, ${orderSummary.address.city}, ${orderSummary.address.state} ${orderSummary.address.postalCode}`
      : "-";

    const invoiceHtml = `
      <html>
        <head>
          <title>Invoice ${orderSummary.id || ""}</title>
        </head>
        <body style="font-family: Arial, sans-serif; color: #111827; padding: 24px;">
          <h1 style="margin:0 0 4px;">Vikash Telecom</h1>
          <p style="margin:0 0 16px; color:#6b7280;">Invoice</p>
          <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
            <div>
              <div style="font-size:12px; color:#6b7280;">Order ID</div>
              <div style="font-weight:600;">${orderSummary.id || "-"}</div>
              <div style="font-size:12px; color:#6b7280; margin-top:8px;">Placed On</div>
              <div>${orderSummary.placedAt ? new Date(orderSummary.placedAt).toLocaleString("en-IN") : "-"}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:12px; color:#6b7280;">Payment Method</div>
              <div style="font-weight:600; text-transform:uppercase;">${orderSummary.paymentMethod}</div>
              <div style="font-size:12px; color:#6b7280; margin-top:8px;">Ship To</div>
              <div>${orderSummary.address?.name || "-"}</div>
              <div style="max-width:240px;">${address}</div>
              <div>${orderSummary.address?.phone || ""}</div>
            </div>
          </div>
          <table style="width:100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom:1px solid #e5e7eb; text-align:left;">
                <th style="padding-bottom:8px;">Item</th>
                <th style="padding-bottom:8px; text-align:center;">Qty</th>
                <th style="padding-bottom:8px; text-align:right;">Unit Price</th>
                <th style="padding-bottom:8px; text-align:right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          <div style="margin-top:16px; display:flex; justify-content:flex-end;">
            <div style="min-width:240px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Subtotal</span><span>₹${orderSummary.subtotal.toLocaleString()}</span></div>
              <div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>Shipping</span><span>${orderSummary.shipping ? `₹${orderSummary.shipping}` : "Free"}</span></div>
              ${orderSummary.discount ? `<div style=\"display:flex; justify-content:space-between; margin-bottom:4px; color:#059669;\"><span>Discount</span><span>-₹${orderSummary.discount.toLocaleString()}</span></div>` : ""}
              <div style="display:flex; justify-content:space-between; font-weight:700; margin-top:8px; border-top:1px solid #e5e7eb; padding-top:8px;">
                <span>Total</span><span>₹${orderSummary.total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(invoiceHtml);
    win.document.close();
    win.focus();
    win.print();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container-main py-12 sm:py-20">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="absolute inline-flex h-20 w-20 animate-ping rounded-full bg-primary/20" />
            <svg className="relative h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Order placed successfully</h1>
          <p className="text-muted-foreground mb-6">Thank you for shopping with us. Your order is confirmed and is being prepared.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="font-semibold">{orderSummary?.id || "VT-2026-2402"}</p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <p className="text-xs text-muted-foreground">Estimated delivery</p>
              <p className="font-semibold">Within 5-7 days</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link to="/">Continue Shopping</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/orders">Track Order</Link>
            </Button>
            <Button variant="outline" onClick={handleDownloadInvoice}>
              Download Invoice (PDF)
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutSuccess;
