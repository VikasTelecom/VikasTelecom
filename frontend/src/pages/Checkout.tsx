import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface Address {
  _id: string;
  label?: string;
  isDefault?: boolean;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country?: string;
}

type PaymentMethod = "cod" | "upi";

const progressSteps = ["Cart", "Address", "Payment", "Review", "Success"] as const;
const UPI_PAYEE_ID = "ranchhodbhai3@icici";
const UPI_PAYEE_NAME = "Vikash Telecom";

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [qrImageError, setQrImageError] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    upiEnabled: true,
    codEnabled: true,
  });
  const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);
  const [form, setForm] = useState({
    label: "Home",
    name: "",
    phone: "",
    line1: "",
    line2: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    api.listAddresses()
      .then((data) => {
        const list = data as Address[];
        setAddresses(list);
        setShowAddressForm(list.length === 0);
        if (list.length > 0) setSelectedAddressId(list[0]._id);
      })
      .catch(() => {
        setShowAddressForm(true);
      });
  }, [isAuthenticated]);

  useEffect(() => {
    setLoadingPaymentSettings(true);
    api.fetchPublicPaymentSettings()
      .then((settings) => {
        setPaymentSettings({
          upiEnabled: settings.upiEnabled,
          codEnabled: settings.codEnabled,
        });
      })
      .catch(() => {
        // Keep default enabled methods if settings endpoint fails.
      })
      .finally(() => setLoadingPaymentSettings(false));
  }, []);

  useEffect(() => {
    if (paymentMethod === "upi" && !paymentSettings.upiEnabled) {
      if (paymentSettings.codEnabled) {
        setPaymentMethod("cod");
      }
    }

    if (paymentMethod === "cod" && !paymentSettings.codEnabled) {
      if (paymentSettings.upiEnabled) {
        setPaymentMethod("upi");
      }
    }
  }, [paymentMethod, paymentSettings]);

  const subtotal = useMemo(() => totalPrice, [totalPrice]);
  const shipping = useMemo(() => (subtotal >= 999 ? 0 : 49), [subtotal]);
  const couponDiscount = useMemo(() => discountAmount, [discountAmount]);
  const codFee = useMemo(() => (paymentMethod === "cod" ? 49 : 0), [paymentMethod]);
  const finalTotal = useMemo(
    () => Math.max(0, subtotal + shipping + codFee - couponDiscount),
    [subtotal, shipping, codFee, couponDiscount],
  );
  const estimatedDelivery = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  }, []);

  const buildUpiDeepLink = (amount: number, orderRef: string) => {
    const params = new URLSearchParams({
      pa: UPI_PAYEE_ID,
      pn: UPI_PAYEE_NAME,
      am: amount.toFixed(2),
      cu: "INR",
      tn: `Order ${orderRef}`,
      tr: orderRef,
    });
    return `upi://pay?${params.toString()}`;
  };

  const upiCheckoutRef = useMemo(() => `VTCHK${Date.now()}`, []);
  const upiQrPayload = useMemo(
    () => buildUpiDeepLink(finalTotal, upiCheckoutRef),
    [finalTotal, upiCheckoutRef],
  );
  const upiQrImageUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiQrPayload)}`,
    [upiQrPayload],
  );

  useEffect(() => {
    if (paymentMethod === "upi") {
      setQrImageError(false);
    }
  }, [paymentMethod, upiQrImageUrl]);

  const validateField = (field: string, value: string) => {
    if (["name", "phone", "line1", "city", "state", "postalCode"].includes(field) && !value.trim()) {
      return "This field is required";
    }
    if (field === "phone" && value.trim() && !/^\d{10}$/.test(value.trim())) {
      return "Enter a valid 10-digit phone number";
    }
    if (field === "postalCode" && value.trim() && !/^\d{6}$/.test(value.trim())) {
      return "Enter a valid 6-digit pincode";
    }
    return "";
  };

  const handleFieldChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleEditAddress = (address: Address) => {
    setEditingId(address._id);
    setShowAddressForm(true);
    setForm({
      label: address.label || "Home",
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      landmark: "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || "IN",
    });
    setSaveAddress(true);
    setSetAsDefault(Boolean(address.isDefault));
  };

  const handleMakeDefault = async (addressId: string) => {
    try {
      const updated = await api.updateAddress(addressId, { isDefault: true });
      const updatedAddress = updated as Address;
      setAddresses((prev) =>
        prev.map((item) => ({ ...item, isDefault: item._id === addressId || updatedAddress.isDefault })),
      );
      setSelectedAddressId(addressId);
      toast({ title: "Default address updated" });
    } catch (error) {
      toast({ title: "Failed to update default", description: (error as Error).message, variant: "destructive" });
    }
  };

  const handleAddAddress = async () => {
    const requiredFields = ["name", "phone", "line1", "city", "state", "postalCode"];
    const nextErrors: { [key: string]: string } = {};
    requiredFields.forEach((field) => {
      nextErrors[field] = validateField(field, String(form[field as keyof typeof form] || ""));
    });
    setFormErrors((prev) => ({ ...prev, ...nextErrors }));
    if (Object.values(nextErrors).some(Boolean)) {
      toast({ title: "Please fix the highlighted fields", variant: "destructive" });
      return;
    }
    try {
      const payload = { ...form, isDefault: setAsDefault, label: form.label, save: saveAddress };
      if (editingId) {
        const updated = await api.updateAddress(editingId, payload);
        const address = updated as Address;
        setAddresses((prev) => prev.map((item) => (item._id === editingId ? address : item)));
        setSelectedAddressId(editingId);
        toast({ title: "Address updated" });
      } else {
        const created = await api.createAddress(payload);
        const address = created as Address;
        setAddresses((prev) => [address, ...prev]);
        setSelectedAddressId(address._id);
        toast({ title: "Address saved" });
      }
      setEditingId(null);
      setShowAddressForm(false);
      setFormErrors({});
      setForm({
        label: "Home",
        name: "",
        phone: "",
        line1: "",
        line2: "",
        landmark: "",
        city: "",
        state: "",
        postalCode: "",
        country: "IN",
      });
    } catch (error) {
      toast({ title: "Failed to save address", description: (error as Error).message, variant: "destructive" });
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({ title: "Enter a coupon code", variant: "destructive" });
      return;
    }
    try {
      const res = await api.validateCoupon(
        couponCode,
        subtotal,
        items.map((item) => ({
          productId: item.product.id,
          category: item.product.category,
          brand: item.product.brand,
        })),
      );
      setDiscountAmount(res.discountAmount);
      setCouponApplied(true);
      toast({ title: "Coupon applied", description: `You saved ₹${res.discountAmount}` });
    } catch (error: any) {
      setCouponApplied(false);
      setDiscountAmount(0);
      toast({ title: "Invalid coupon", description: error.message || "Invalid coupon", variant: "destructive" });
    }
  };

  const handlePay = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!selectedAddressId) {
      toast({ title: "Select a shipping address", variant: "destructive" });
      return;
    }
    if (!termsAccepted) {
      toast({ title: "Accept the terms to continue", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    if (!paymentSettings.upiEnabled && !paymentSettings.codEnabled) {
      toast({ title: "No payment methods available", description: "Please contact support.", variant: "destructive" });
      return;
    }
    try {
      setLoading(true);
      const orderPayload = {
        items: items.map((item) => ({
          product: item.product.id,
          productId: item.product.id,
          name: item.product.title,
          category: item.product.category,
          qty: item.quantity,
          price: item.variant?.price ?? item.product.price,
          image: item.product.image,
          variant: item.variant,
        })),
        couponCode: couponApplied ? couponCode : undefined,
        discount: couponDiscount,
        total: finalTotal,
        address: selectedAddressId,
        paymentMethod,
      };
      const created = await api.createOrder(orderPayload);
      const address = addresses.find((entry) => entry._id === selectedAddressId);
      const summary = {
        id: (created as { id?: string; _id?: string }).id || (created as { id?: string; _id?: string })._id || "",
        items: orderPayload.items,
        total: finalTotal,
        subtotal,
        shipping,
        discount: couponDiscount,
        paymentMethod,
        address,
        placedAt: new Date().toISOString(),
      };
      localStorage.setItem("last_order", JSON.stringify(summary));

      if (paymentMethod === "upi") {
        const orderRef = summary.id || `VT${Date.now()}`;
        const upiDeepLink = buildUpiDeepLink(finalTotal, orderRef);

        // Opens installed UPI apps (GPay/PhonePe/Paytm/BHIM) on supported devices.
        window.location.href = upiDeepLink;
        toast({
          title: "Redirecting to UPI app...",
          description: `Pay ₹${finalTotal.toLocaleString("en-IN")} to ${UPI_PAYEE_ID}`,
        });
        return;
      }

      toast({ title: "Order placed successfully!" });
      clearCart();
      setTimeout(() => navigate("/checkout/success"), 500);
    } catch (error) {
      toast({ title: "Order failed", description: (error as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />
      <main className="container-main py-8 lg:py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <span>/</span>
          <span className="text-foreground">Checkout</span>
        </div>

        <section className="mb-8 rounded-2xl border border-border bg-white p-4 sm:p-6">
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
            {progressSteps.map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                    step === "Address" ? "border-primary bg-primary/10 text-primary" : "border-border"
                  }`}
                >
                  {index + 1}
                </span>
                <span className={step === "Address" ? "text-foreground font-medium" : ""}>{step}</span>
                {index < progressSteps.length - 1 && (
                  <span className="hidden sm:inline-block h-px w-8 bg-border" />
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_395px] gap-8">
          <section className="space-y-6">
            <div className="border border-border rounded-2xl p-5 sm:p-6 bg-white">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Shipping Address</h2>
                  <p className="text-sm text-muted-foreground">Choose or add a trusted delivery address.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Verified checkout
                </div>
              </div>

              {isAuthenticated ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-end">
                    {!showAddressForm && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setFormErrors({});
                          setForm({
                            label: "Home",
                            name: "",
                            phone: "",
                            line1: "",
                            line2: "",
                            landmark: "",
                            city: "",
                            state: "",
                            postalCode: "",
                            country: "IN",
                          });
                          setShowAddressForm(true);
                        }}
                      >
                        Add New Address
                      </Button>
                    )}
                  </div>

                  {addresses.length > 0 && (
                    <div className="space-y-3">
                      {addresses.map((address) => (
                        <div
                          key={address._id}
                          className={`flex flex-col gap-3 rounded-xl border p-4 transition ${
                            selectedAddressId === address._id ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="address"
                              checked={selectedAddressId === address._id}
                              onChange={() => setSelectedAddressId(address._id)}
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{address.name}</p>
                                {address.isDefault && (
                                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Default</span>
                                )}
                                {address.label && (
                                  <span className="text-xs text-muted-foreground">{address.label}</span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                              <p className="text-sm text-muted-foreground">{address.city}, {address.state} {address.postalCode}</p>
                              <p className="text-sm text-muted-foreground">{address.phone}</p>
                            </div>
                          </label>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <button
                              type="button"
                              onClick={() => handleEditAddress(address)}
                              className="text-primary font-semibold"
                            >
                              Edit address
                            </button>
                            {!address.isDefault && (
                              <button
                                type="button"
                                onClick={() => handleMakeDefault(address._id)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                Make default
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddressForm && (
                    <div className="border-t border-border pt-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <p className="text-sm font-semibold">{editingId ? "Edit Address" : "Add New Address"}</p>
                        {addresses.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(null);
                              setShowAddressForm(false);
                              setFormErrors({});
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label>Full Name</Label>
                          <Input value={form.name} onChange={(e) => handleFieldChange("name", e.target.value)} />
                          {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label>Phone Number</Label>
                          <Input value={form.phone} onChange={(e) => handleFieldChange("phone", e.target.value)} />
                          {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label>Pincode</Label>
                          <Input value={form.postalCode} onChange={(e) => handleFieldChange("postalCode", e.target.value)} />
                          {formErrors.postalCode && <p className="text-xs text-destructive">{formErrors.postalCode}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label>Address Type</Label>
                          <select
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={form.label}
                            onChange={(e) => handleFieldChange("label", e.target.value)}
                          >
                            <option value="Home">Home</option>
                            <option value="Work">Work</option>
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label>Address Line 1</Label>
                          <Textarea value={form.line1} onChange={(e) => handleFieldChange("line1", e.target.value)} />
                          {formErrors.line1 && <p className="text-xs text-destructive">{formErrors.line1}</p>}
                        </div>
                        <div className="md:col-span-2 space-y-1">
                          <Label>Address Line 2</Label>
                          <Input value={form.line2} onChange={(e) => handleFieldChange("line2", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>Landmark</Label>
                          <Input value={form.landmark} onChange={(e) => handleFieldChange("landmark", e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label>City</Label>
                          <Input value={form.city} onChange={(e) => handleFieldChange("city", e.target.value)} />
                          {formErrors.city && <p className="text-xs text-destructive">{formErrors.city}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label>State</Label>
                          <Input value={form.state} onChange={(e) => handleFieldChange("state", e.target.value)} />
                          {formErrors.state && <p className="text-xs text-destructive">{formErrors.state}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label>Country</Label>
                          <Input value={form.country} onChange={(e) => handleFieldChange("country", e.target.value)} />
                        </div>
                        <div className="md:col-span-2 flex flex-wrap gap-4 text-sm">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
                            Save this address to my account
                          </label>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" checked={setAsDefault} onChange={(e) => setSetAsDefault(e.target.checked)} />
                            Set as default address
                          </label>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button variant="outline" onClick={handleAddAddress}>{editingId ? "Update Address" : "Save Address"}</Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Please <Link to="/login" className="text-primary font-semibold">log in</Link> to add a shipping address.
                </div>
              )}
            </div>

            <div className="border border-border rounded-2xl p-5 sm:p-6 bg-white space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Payment Method</h2>
                <p className="text-sm text-muted-foreground">Choose the most convenient and secure payment option.</p>
              </div>
              {loadingPaymentSettings && (
                <p className="text-xs text-muted-foreground">Loading payment settings...</p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { value: "cod", label: "Cash on Delivery", note: "Pay when it arrives" },
                  { value: "upi", label: "UPI", note: "Instant bank transfer" },
                ]
                  .filter((method) =>
                    method.value === "upi" ? paymentSettings.upiEnabled : paymentSettings.codEnabled,
                  )
                  .map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer ${
                      paymentMethod === method.value ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === method.value}
                      onChange={() => setPaymentMethod(method.value as PaymentMethod)}
                    />
                    <div>
                      <p className="font-medium">{method.label}</p>
                      <p className="text-xs text-muted-foreground">{method.note}</p>
                    </div>
                  </label>
                ))}
              </div>
              {!paymentSettings.upiEnabled && !paymentSettings.codEnabled && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  Payment is temporarily unavailable. Please contact support.
                </div>
              )}
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {paymentSettings.upiEnabled && <span className="rounded-full border px-2 py-1">UPI</span>}
                {paymentSettings.codEnabled && <span className="rounded-full border px-2 py-1">Cash on Delivery</span>}
              </div>
              {paymentMethod === "cod" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                  COD convenience fee ₹{codFee} will be added at checkout.
                </div>
              )}
              {paymentMethod !== "cod" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                  Secure payment with bank-grade encryption.
                </div>
              )}
              {paymentMethod === "upi" && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm text-foreground space-y-3">
                  <div>
                    UPI ID: <span className="font-semibold">{UPI_PAYEE_ID}</span>
                  </div>
                  <div className="rounded-lg border border-primary/20 bg-white p-3">
                    <p className="text-xs text-muted-foreground mb-2">Scan to pay ₹{finalTotal.toLocaleString("en-IN")}</p>
                    {!qrImageError ? (
                      <img
                        src={upiQrImageUrl}
                        alt={`UPI QR for ₹${finalTotal.toLocaleString("en-IN")}`}
                        className="h-48 w-48 sm:h-56 sm:w-56 rounded-md border border-border bg-white"
                        loading="lazy"
                        onError={() => setQrImageError(true)}
                      />
                    ) : (
                      <p className="text-xs text-destructive">Unable to load QR right now. Use UPI ID above to pay manually.</p>
                    )}
                    <p className="mt-2 text-xs text-muted-foreground">This QR is generated with your current order total and pays to {UPI_PAYEE_ID}.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-border rounded-2xl p-5 sm:p-6 bg-white space-y-4">
              <h2 className="text-lg font-semibold">Review Order</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Delivery to</p>
                  {selectedAddressId ? (
                    addresses
                      .filter((address) => address._id === selectedAddressId)
                      .map((address) => (
                        <div key={address._id}>
                          <p className="font-medium">{address.name}</p>
                          <p className="text-muted-foreground">{address.line1}{address.line2 ? `, ${address.line2}` : ""}</p>
                          <p className="text-muted-foreground">{address.city}, {address.state} {address.postalCode}</p>
                          <p className="text-muted-foreground">{address.phone}</p>
                        </div>
                      ))
                  ) : (
                    <p className="text-muted-foreground">Select a delivery address to continue.</p>
                  )}
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Payment method</p>
                  <p className="font-medium">{paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod.toUpperCase()}</p>
                  <p className="text-muted-foreground">Estimated delivery by {estimatedDelivery}</p>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                I agree to the terms and conditions
              </label>
            </div>

            <div className="border border-border rounded-2xl p-5 sm:p-6 bg-white">
              <h2 className="text-lg font-semibold mb-3">Trust & Support</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                {[
                  "Fast Delivery",
                  "Customer Support 24/7",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-xl border border-border p-3">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4 min-w-0">
            <div className="border border-border rounded-2xl p-5 sm:p-6 bg-white lg:sticky lg:top-24">
              <h2 className="text-lg font-semibold">Order Summary</h2>
              <div className="mt-4 space-y-3">
                {items.map((item) => (
                  <div key={item.lineId} className="flex gap-3 text-sm items-start">
                    <div className="flex-shrink-0">
                      <img 
                        src={item.product.image} 
                        alt={item.product.title} 
                        className="h-16 w-16 rounded-lg border border-border object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm break-words whitespace-normal line-clamp-2">
                        {item.product.title}
                      </p>
                      {item.variant?.attributes && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {[item.variant.attributes.color, item.variant.attributes.storage, item.variant.attributes.ram]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                      {item.variant?.name && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">Variant: {item.variant.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1 font-medium">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold text-sm whitespace-nowrap">
                      ₹{((item.variant?.price ?? item.product.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                {codFee > 0 && (
                  <div className="flex items-center justify-between">
                    <span>COD fee</span>
                    <span>₹{codFee.toLocaleString()}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex items-center justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-₹{couponDiscount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="mt-3 border-t border-border pt-3 flex items-center justify-between font-semibold">
                <span>Total</span>
                <span>₹{finalTotal.toLocaleString()}</span>
              </div>
              <p className="mt-2 text-xs text-emerald-600">You saved ₹{couponDiscount.toLocaleString()} today</p>
              <div className="mt-4 flex items-center gap-2">
                <Input
                  className="bg-white"
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
                <Button variant="outline" onClick={applyCoupon} disabled={couponApplied}>
                  {couponApplied ? "Applied" : "Apply"}
                </Button>
              </div>
              <Button size="lg" onClick={handlePay} disabled={loading || items.length === 0} className="w-full mt-4 bg-primary hover:bg-primary/90">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </span>
                ) : (
                  paymentMethod === "upi"
                    ? `Pay via UPI — ₹${finalTotal.toLocaleString("en-IN")}`
                    : `Place Order — ₹${finalTotal.toLocaleString("en-IN")}`
                )}
              </Button>
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                By placing your order, you agree to our privacy policy and terms of sale.
              </div>
            </div>
            <details className="lg:hidden rounded-2xl border border-border bg-white p-4">
              <summary className="cursor-pointer text-sm font-semibold">View order summary</summary>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? "Free" : `₹${shipping}`}</span>
                </div>
                <div className="flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </details>
          </aside>
        </div>
      </main>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Total payable</p>
            <p className="font-semibold">₹{finalTotal.toLocaleString()}</p>
          </div>
          <Button onClick={handlePay} disabled={loading || items.length === 0} className="flex-1">
            {loading ? "Processing..." : paymentMethod === "upi" ? "Pay via UPI" : "Place Order"}
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
