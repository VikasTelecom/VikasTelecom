import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, ShieldCheck, ShoppingBag, LogOut, ChevronRight, Phone } from "lucide-react";

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

const UserProfile = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateProfile, logout } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [addressForm, setAddressForm] = useState({
    label: "Home",
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "IN",
    isDefault: false,
  });

  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user?.name, user?.phone]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingAddresses(false);
      return;
    }

    api.listAddresses()
      .then((data) => setAddresses(data as Address[]))
      .catch(() => setAddresses([]))
      .finally(() => setLoadingAddresses(false));
  }, [isAuthenticated]);

  const resetAddressForm = () => {
    setAddressForm({
      label: "Home",
      name: name || "",
      phone: phone || "",
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "IN",
      isDefault: false,
    });
    setEditingAddressId(null);
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (phone.trim() && !/^\d{10}$/.test(phone.trim())) {
      toast({ title: "Enter a valid 10-digit mobile number", variant: "destructive" });
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      toast({ title: "Profile updated" });
    } catch (error) {
      toast({ title: "Failed to update profile", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address._id);
    setAddressForm({
      label: address.label || "Home",
      name: address.name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || "",
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country || "IN",
      isDefault: Boolean(address.isDefault),
    });
  };

  const handleSaveAddress = async () => {
    const required = ["name", "phone", "line1", "city", "state", "postalCode"] as const;
    const missing = required.some((key) => !addressForm[key].trim());

    if (missing) {
      toast({ title: "Please fill all required address fields", variant: "destructive" });
      return;
    }

    if (!/^\d{10}$/.test(addressForm.phone.trim())) {
      toast({ title: "Address phone must be a valid 10-digit mobile number", variant: "destructive" });
      return;
    }

    if (!/^\d{6}$/.test(addressForm.postalCode.trim())) {
      toast({ title: "Pincode must be 6 digits", variant: "destructive" });
      return;
    }

    try {
      setSavingAddress(true);
      const payload = {
        label: addressForm.label,
        name: addressForm.name.trim(),
        phone: addressForm.phone.trim(),
        line1: addressForm.line1.trim(),
        line2: addressForm.line2.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim(),
        postalCode: addressForm.postalCode.trim(),
        country: addressForm.country.trim() || "IN",
        isDefault: addressForm.isDefault,
      };

      let savedAddressId = editingAddressId || "";

      if (editingAddressId) {
        const updated = await api.updateAddress(editingAddressId, payload);
        const address = updated as Address;
        savedAddressId = address._id;
        setAddresses((prev) => prev.map((item) => (item._id === editingAddressId ? address : item)));
        toast({ title: "Address updated" });
      } else {
        const created = await api.createAddress(payload);
        const address = created as Address;
        savedAddressId = address._id;
        setAddresses((prev) => [address, ...prev]);
        toast({ title: "Address added" });
      }

      if (payload.isDefault) {
        setAddresses((prev) => prev.map((item) => ({ ...item, isDefault: item._id === savedAddressId })));
      }

      resetAddressForm();
    } catch (error) {
      toast({ title: "Failed to save address", description: (error as Error).message, variant: "destructive" });
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      setDeletingId(id);
      await api.deleteAddress(id);
      setAddresses((prev) => prev.filter((item) => item._id !== id));
      if (editingAddressId === id) {
        resetAddressForm();
      }
      toast({ title: "Address removed" });
    } catch (error) {
      toast({ title: "Failed to delete address", description: (error as Error).message, variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const updated = await api.updateAddress(id, { isDefault: true });
      const defaultAddress = updated as Address;
      setAddresses((prev) => prev.map((item) => ({ ...item, isDefault: item._id === defaultAddress._id })));
      toast({ title: "Default address updated" });
    } catch (error) {
      toast({ title: "Failed to update default address", description: (error as Error).message, variant: "destructive" });
    }
  };

  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <CartDrawer />

      <main className="pt-20 pb-8">
        <div className="container-main space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">My Account</p>
            <div className="mt-4 flex items-center gap-4">
              <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border border-border">
                <AvatarFallback className="text-base sm:text-lg font-semibold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{user?.name || "User"}</h1>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <section className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-semibold mb-4">Profile Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="space-y-1.5">
                    <Label>Full Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mobile Number</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="10-digit mobile number" />
                  </div>
                </div>
                <Button onClick={handleUpdateProfile} disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save profile"}
                </Button>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <span className="text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Name</span>
                    <span className="font-medium text-right">{user?.name || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground flex items-center gap-2"><Mail className="w-4 h-4" /> Email</span>
                    <span className="font-medium text-right break-all">{user?.email || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4" /> Mobile</span>
                    <span className="font-medium text-right">{user?.phone || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Role</span>
                    <span className="inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold capitalize">{user?.role || "user"}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">Manage Addresses</h2>
                  <Button variant="outline" size="sm" onClick={resetAddressForm}>Add New</Button>
                </div>

                {loadingAddresses ? (
                  <p className="text-sm text-muted-foreground">Loading addresses...</p>
                ) : addresses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No address saved yet.</p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <div key={address._id} className="rounded-xl border border-border p-3">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-medium text-sm">{address.name} {address.label ? `(${address.label})` : ""}</p>
                            <p className="text-xs text-muted-foreground">{address.phone}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {address.isDefault && <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Default</span>}
                            {!address.isDefault && (
                              <button type="button" className="text-xs text-primary" onClick={() => handleSetDefault(address._id)}>
                                Set default
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">
                          {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}
                        </p>
                        <div className="mt-3 flex items-center gap-3 text-sm">
                          <button type="button" className="text-primary" onClick={() => handleEditAddress(address)}>Edit</button>
                          <button
                            type="button"
                            className="text-destructive"
                            onClick={() => handleDeleteAddress(address._id)}
                            disabled={deletingId === address._id}
                          >
                            {deletingId === address._id ? "Removing..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl border border-border p-4 space-y-3">
                  <p className="text-sm font-semibold">{editingAddressId ? "Edit Address" : "Add Address"}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Label</Label>
                      <Input value={addressForm.label} onChange={(e) => setAddressForm((prev) => ({ ...prev, label: e.target.value }))} placeholder="Home / Work" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Name</Label>
                      <Input value={addressForm.name} onChange={(e) => setAddressForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Receiver name" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Mobile</Label>
                      <Input value={addressForm.phone} onChange={(e) => setAddressForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="10-digit mobile" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pincode</Label>
                      <Input value={addressForm.postalCode} onChange={(e) => setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))} placeholder="6-digit pincode" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>City</Label>
                      <Input value={addressForm.city} onChange={(e) => setAddressForm((prev) => ({ ...prev, city: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>State</Label>
                      <Input value={addressForm.state} onChange={(e) => setAddressForm((prev) => ({ ...prev, state: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Address Line 1</Label>
                      <Textarea value={addressForm.line1} onChange={(e) => setAddressForm((prev) => ({ ...prev, line1: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2 space-y-1.5">
                      <Label>Address Line 2 (optional)</Label>
                      <Input value={addressForm.line2} onChange={(e) => setAddressForm((prev) => ({ ...prev, line2: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Country</Label>
                      <Input value={addressForm.country} onChange={(e) => setAddressForm((prev) => ({ ...prev, country: e.target.value }))} />
                    </div>
                    <label className="flex items-center gap-2 text-sm sm:mt-7">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      />
                      Set as default
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={handleSaveAddress} disabled={savingAddress}>
                      {savingAddress ? "Saving..." : editingAddressId ? "Update address" : "Save address"}
                    </Button>
                    {editingAddressId && (
                      <Button variant="outline" onClick={resetAddressForm}>Cancel edit</Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-5 space-y-2">
                <h2 className="font-semibold mb-2">Quick Actions</h2>
                <Link to="/orders" className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors">
                  <span className="text-sm font-medium">View my orders</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
                <Link to="/cart" className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/40 transition-colors">
                  <span className="text-sm font-medium">Go to cart</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </Link>
              </div>
            </section>

            <aside className="rounded-2xl border border-border bg-card p-5 h-fit space-y-3">
              <div className="flex items-start gap-3">
                <ShoppingBag className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold">Shopping account</h3>
                  <p className="text-sm text-muted-foreground">Manage your account and review order history.</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => navigate("/orders")}>My Orders</Button>
              <Button
                variant="outline"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => {
                  logout();
                  navigate("/");
                }}
              >
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </Button>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;
