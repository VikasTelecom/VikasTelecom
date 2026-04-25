import { useEffect, useState } from "react";
import { Save, Store, Phone, Mail, Globe, MapPin, Bell, Shield, Palette, CreditCard, Truck, Images, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const SECTIONS = [
    { id: "store", label: "Store Info", icon: Store },
    { id: "banners", label: "Hero Banners", icon: Images },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "shipping", label: "Shipping", icon: Truck },
    { id: "payment", label: "Payment", icon: CreditCard },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
];

export default function Settings() {
    const [activeSection, setActiveSection] = useState("store");
    const [bannerImages, setBannerImages] = useState(["", "", ""]);
    const [bannerTitles, setBannerTitles] = useState(["", "", ""]);
    const [bannerSubtitles, setBannerSubtitles] = useState(["", "", ""]);
    const [bannerCtas, setBannerCtas] = useState(["", "", ""]);
    const [loadingBanners, setLoadingBanners] = useState(false);
    const [savingBanners, setSavingBanners] = useState(false);
    const [uploadingBanners, setUploadingBanners] = useState([false, false, false]);
    const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(false);
    const [savingPaymentSettings, setSavingPaymentSettings] = useState(false);

    // Store Info
    const [store, setStore] = useState({
        name: "Vikash Telecom",
        tagline: "India's Best Electronics & Mobile Accessories",
        email: "support@vikash.com",
        phone: "+91 98765 43210",
        website: "www.vikash.com",
        address: "123, Tech Park, Pune, Maharashtra 411001",
        currency: "INR",
        language: "en",
        gst: "27AABCV1234A1Z5",
        description: "Vikash Telecom is a leading online store for electronics, mobile accessories, audio devices, and smart gadgets in India.",
    });

    // Notifications
    const [notifications, setNotifications] = useState({
        newOrder: true,
        orderShipped: true,
        lowStock: true,
        newReview: false,
        newUser: false,
        weeklyReport: true,
        emailDigest: true,
    });

    // Shipping
    const [shipping, setShipping] = useState({
        freeShippingAbove: "999",
        standardRate: "49",
        expressRate: "99",
        codAvailable: true,
        codCharges: "29",
        deliveryDays: "3-5",
        returnWindow: "7",
    });

    // Payment
    const [payment, setPayment] = useState({
        upiEnabled: true,
        codEnabled: true,
    });

    // Appearance
    const [appearance, setAppearance] = useState({
        primaryColor: "#f97316",
        accentColor: "#3b82f6",
        font: "inter",
        darkMode: false,
        showBadges: true,
        showRatings: true,
        showDiscountTag: true,
        productsPerRow: "4",
    });

    // Security
    const [security, setSecurity] = useState({
        twoFactor: false,
        loginAlerts: true,
        sessionTimeout: "60",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        if (activeSection !== "banners") return;

        setLoadingBanners(true);
        api.fetchHomeHeroBanners()
            .then((banner) => {
                const nextImages = ["", "", ""];
                const nextTitles = ["", "", ""];
                const nextSubtitles = ["", "", ""];
                const nextCtas = ["", "", ""];
                for (let i = 0; i < 3; i += 1) {
                    nextImages[i] = banner.images[i] || "";
                    nextTitles[i] = banner.titles[i] || "";
                    nextSubtitles[i] = banner.subtitles[i] || "";
                    nextCtas[i] = banner.ctas[i] || "";
                }
                setBannerImages(nextImages);
                setBannerTitles(nextTitles);
                setBannerSubtitles(nextSubtitles);
                setBannerCtas(nextCtas);
            })
            .catch((error) => {
                toast({
                    title: "Failed to load hero banners",
                    description: (error as Error).message,
                    variant: "destructive",
                });
            })
            .finally(() => setLoadingBanners(false));
    }, [activeSection]);

    useEffect(() => {
        if (activeSection !== "payment") return;

        setLoadingPaymentSettings(true);
        api.adminGetPaymentSettings()
            .then((settings) => {
                setPayment({
                    upiEnabled: settings.upiEnabled,
                    codEnabled: settings.codEnabled,
                });
            })
            .catch((error) => {
                toast({
                    title: "Failed to load payment settings",
                    description: (error as Error).message,
                    variant: "destructive",
                });
            })
            .finally(() => setLoadingPaymentSettings(false));
    }, [activeSection]);

    const handleSave = (section: string) => {
        toast({ title: `✅ ${section} settings saved successfully!` });
    };

    const handleBannerFileUpload = async (index: number, file: File) => {
        setUploadingBanners((prev) => prev.map((value, idx) => (idx === index ? true : value)));
        try {
            const result = await api.adminUploadHeroBannerImage(file);
            setBannerImages((prev) => {
                const next = [...prev];
                next[index] = result.image;
                return next;
            });
            toast({ title: `Slide ${index + 1} image uploaded` });
        } catch (error) {
            toast({
                title: `Failed to upload slide ${index + 1} image`,
                description: (error as Error).message,
                variant: "destructive",
            });
        } finally {
            setUploadingBanners((prev) => prev.map((value, idx) => (idx === index ? false : value)));
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your store configuration</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-56 flex-shrink-0">
                    <Card>
                        <CardContent className="p-2">
                            <nav className="space-y-0.5">
                                {SECTIONS.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => setActiveSection(s.id)}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeSection === s.id
                                                ? "bg-orange-50 text-orange-600 border border-orange-100"
                                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                            }`}
                                    >
                                        <s.icon className="w-4 h-4 flex-shrink-0" />
                                        {s.label}
                                    </button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">

                    {/* Store Info */}
                    {activeSection === "store" && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base"><Store className="w-5 h-5 text-orange-500" /> Store Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Store Name</Label>
                                        <Input value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Tagline</Label>
                                        <Input value={store.tagline} onChange={(e) => setStore({ ...store, tagline: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Support Email</Label>
                                        <Input type="email" value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Phone</Label>
                                        <Input value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Website</Label>
                                        <Input value={store.website} onChange={(e) => setStore({ ...store, website: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">GST Number</Label>
                                        <Input value={store.gst} onChange={(e) => setStore({ ...store, gst: e.target.value })} className="font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="font-semibold flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> Store Address</Label>
                                    <Input value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="font-semibold">Store Description</Label>
                                    <Textarea value={store.description} onChange={(e) => setStore({ ...store, description: e.target.value })} className="resize-none min-h-[80px] text-sm" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Currency</Label>
                                        <Select value={store.currency} onValueChange={(v) => setStore({ ...store, currency: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="INR">₹ Indian Rupee (INR)</SelectItem>
                                                <SelectItem value="USD">$ US Dollar (USD)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Language</Label>
                                        <Select value={store.language} onValueChange={(v) => setStore({ ...store, language: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="hi">Hindi</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleSave("Store")}>
                                    <Save className="w-4 h-4" /> Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notifications */}
                    {activeSection === "notifications" && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base"><Bell className="w-5 h-5 text-orange-500" /> Notification Preferences</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {[
                                    { key: "newOrder", label: "New Order Placed", desc: "Get notified when a customer places an order" },
                                    { key: "orderShipped", label: "Order Shipped", desc: "Alert when an order is dispatched" },
                                    { key: "lowStock", label: "Low Stock Alert", desc: "Warning when a product stock drops below 10" },
                                    { key: "newReview", label: "New Review", desc: "Notification for every new customer review" },
                                    { key: "newUser", label: "New User Registration", desc: "Alert when a new customer signs up" },
                                    { key: "weeklyReport", label: "Weekly Sales Report", desc: "Receive weekly performance summary" },
                                    { key: "emailDigest", label: "Email Digest", desc: "Daily summary of all admin activities" },
                                ].map((item) => (
                                    <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                                        <div>
                                            <p className="font-medium text-sm">{item.label}</p>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <Switch
                                            checked={notifications[item.key as keyof typeof notifications]}
                                            onCheckedChange={(v) => setNotifications({ ...notifications, [item.key]: v })}
                                        />
                                    </div>
                                ))}
                                <div className="pt-3">
                                    <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleSave("Notifications")}>
                                        <Save className="w-4 h-4" /> Save Changes
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Hero Banners */}
                    {activeSection === "banners" && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base"><Images className="w-5 h-5 text-orange-500" /> Home Hero Banner Images</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-sm text-muted-foreground">Update the 3 sliding banner images and text shown on the landing page.</p>

                                {loadingBanners ? (
                                    <p className="text-sm text-muted-foreground">Loading banner images...</p>
                                ) : (
                                    <div className="space-y-4">
                                        {bannerImages.map((url, idx) => (
                                            <div key={idx} className="space-y-2">
                                                <Label className="font-semibold">Slide {idx + 1} Image URL</Label>
                                                <Input
                                                    placeholder="https://..."
                                                    value={url}
                                                    onChange={(e) => {
                                                        const next = [...bannerImages];
                                                        next[idx] = e.target.value;
                                                        setBannerImages(next);
                                                    }}
                                                    className="text-sm font-mono"
                                                />
                                                <div className="flex items-center gap-3">
                                                    <Label
                                                        htmlFor={`slide-upload-${idx}`}
                                                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium cursor-pointer hover:bg-muted"
                                                    >
                                                        <Upload className="w-4 h-4" /> {uploadingBanners[idx] ? "Uploading..." : "Upload From Device"}
                                                    </Label>
                                                    <input
                                                        id={`slide-upload-${idx}`}
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploadingBanners[idx]}
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                handleBannerFileUpload(idx, file);
                                                            }
                                                            e.currentTarget.value = "";
                                                        }}
                                                    />
                                                    <span className="text-xs text-muted-foreground">JPG, PNG, WEBP up to 5MB</span>
                                                </div>
                                                <Label className="font-semibold">Slide {idx + 1} Title</Label>
                                                <Input
                                                    placeholder="Enter slide title"
                                                    value={bannerTitles[idx]}
                                                    onChange={(e) => {
                                                        const next = [...bannerTitles];
                                                        next[idx] = e.target.value;
                                                        setBannerTitles(next);
                                                    }}
                                                />
                                                <Label className="font-semibold">Slide {idx + 1} Subtitle</Label>
                                                <Textarea
                                                    placeholder="Enter slide subtitle"
                                                    value={bannerSubtitles[idx]}
                                                    onChange={(e) => {
                                                        const next = [...bannerSubtitles];
                                                        next[idx] = e.target.value;
                                                        setBannerSubtitles(next);
                                                    }}
                                                    className="resize-none min-h-[70px] text-sm"
                                                />
                                                <Label className="font-semibold">Slide {idx + 1} Button Text</Label>
                                                <Input
                                                    placeholder="e.g. Shop Now"
                                                    value={bannerCtas[idx]}
                                                    onChange={(e) => {
                                                        const next = [...bannerCtas];
                                                        next[idx] = e.target.value;
                                                        setBannerCtas(next);
                                                    }}
                                                />
                                                {url ? (
                                                    <img
                                                        src={url}
                                                        alt={`Slide ${idx + 1}`}
                                                        className="w-full max-w-sm h-28 object-cover rounded-lg border"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = "none";
                                                        }}
                                                    />
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <Button
                                    className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={loadingBanners || savingBanners}
                                    onClick={async () => {
                                        const cleanedImages = bannerImages.map((value) => value.trim());
                                        const cleanedTitles = bannerTitles.map((value) => value.trim());
                                        const cleanedSubtitles = bannerSubtitles.map((value) => value.trim());
                                        const cleanedCtas = bannerCtas.map((value) => value.trim());

                                        if (cleanedImages.some((value) => !value)) {
                                            toast({
                                                title: "All 3 banner image URLs are required",
                                                variant: "destructive",
                                            });
                                            return;
                                        }

                                        if (cleanedTitles.some((value) => !value) || cleanedSubtitles.some((value) => !value) || cleanedCtas.some((value) => !value)) {
                                            toast({
                                                title: "All 3 slides need title, subtitle and button text",
                                                variant: "destructive",
                                            });
                                            return;
                                        }

                                        setSavingBanners(true);
                                        try {
                                            const result = await api.adminUpdateHomeHeroBanners({
                                                images: cleanedImages,
                                                titles: cleanedTitles,
                                                subtitles: cleanedSubtitles,
                                                ctas: cleanedCtas,
                                            });
                                            const nextImages = ["", "", ""];
                                            const nextTitles = ["", "", ""];
                                            const nextSubtitles = ["", "", ""];
                                            const nextCtas = ["", "", ""];
                                            for (let i = 0; i < 3; i += 1) {
                                                nextImages[i] = result.images[i] || cleanedImages[i];
                                                nextTitles[i] = result.titles[i] || cleanedTitles[i];
                                                nextSubtitles[i] = result.subtitles[i] || cleanedSubtitles[i];
                                                nextCtas[i] = result.ctas[i] || cleanedCtas[i];
                                            }
                                            setBannerImages(nextImages);
                                            setBannerTitles(nextTitles);
                                            setBannerSubtitles(nextSubtitles);
                                            setBannerCtas(nextCtas);
                                            toast({ title: "Hero banners and text updated successfully" });
                                        } catch (error) {
                                            toast({
                                                title: "Failed to update hero banners",
                                                description: (error as Error).message,
                                                variant: "destructive",
                                            });
                                        } finally {
                                            setSavingBanners(false);
                                        }
                                    }}
                                >
                                    <Save className="w-4 h-4" /> {savingBanners ? "Saving..." : "Save Banner Content"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Shipping */}
                    {activeSection === "shipping" && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base"><Truck className="w-5 h-5 text-orange-500" /> Shipping Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                                    💡 These settings control how shipping is calculated at checkout for your customers.
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Free Shipping Above (₹)</Label>
                                        <Input type="number" value={shipping.freeShippingAbove} onChange={(e) => setShipping({ ...shipping, freeShippingAbove: e.target.value })} />
                                        <p className="text-xs text-muted-foreground">Set 0 to always offer free shipping</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Standard Shipping Rate (₹)</Label>
                                        <Input type="number" value={shipping.standardRate} onChange={(e) => setShipping({ ...shipping, standardRate: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Express Shipping Rate (₹)</Label>
                                        <Input type="number" value={shipping.expressRate} onChange={(e) => setShipping({ ...shipping, expressRate: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Estimated Delivery (Days)</Label>
                                        <Input value={shipping.deliveryDays} onChange={(e) => setShipping({ ...shipping, deliveryDays: e.target.value })} placeholder="e.g. 3-5" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Return Window (Days)</Label>
                                        <Input type="number" value={shipping.returnWindow} onChange={(e) => setShipping({ ...shipping, returnWindow: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm">Cash on Delivery (COD)</p>
                                        <p className="text-xs text-muted-foreground">Allow customers to pay on delivery</p>
                                    </div>
                                    <Switch checked={shipping.codAvailable} onCheckedChange={(v) => setShipping({ ...shipping, codAvailable: v })} />
                                </div>
                                {shipping.codAvailable && (
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">COD Handling Charges (₹)</Label>
                                        <Input type="number" value={shipping.codCharges} onChange={(e) => setShipping({ ...shipping, codCharges: e.target.value })} />
                                    </div>
                                )}
                                <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleSave("Shipping")}>
                                    <Save className="w-4 h-4" /> Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment */}
                    {activeSection === "payment" && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="w-5 h-5 text-orange-500" /> Payment Settings</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {loadingPaymentSettings && (
                                    <p className="text-sm text-muted-foreground">Loading payment settings...</p>
                                )}
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold mb-2">Accepted Payment Methods</p>
                                    {[
                                        { key: "upiEnabled", label: "UPI / QR Code", desc: "PhonePe, Google Pay, Paytm, BHIM" },
                                        { key: "codEnabled", label: "Cash on Delivery", desc: "Pay when order arrives" },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                                            <div>
                                                <p className="font-medium text-sm">{item.label}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                            <Switch
                                                checked={payment[item.key as keyof typeof payment] as boolean}
                                                onCheckedChange={(v) => setPayment({ ...payment, [item.key]: v })}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                                    disabled={loadingPaymentSettings || savingPaymentSettings}
                                    onClick={async () => {
                                        setSavingPaymentSettings(true);
                                        try {
                                            const updated = await api.adminUpdatePaymentSettings({
                                                upiEnabled: payment.upiEnabled,
                                                codEnabled: payment.codEnabled,
                                            });

                                            setPayment({
                                                upiEnabled: updated.upiEnabled,
                                                codEnabled: updated.codEnabled,
                                            });

                                            toast({ title: "✅ Payment settings saved successfully!" });
                                        } catch (error) {
                                            toast({
                                                title: "Failed to save payment settings",
                                                description: (error as Error).message,
                                                variant: "destructive",
                                            });
                                        } finally {
                                            setSavingPaymentSettings(false);
                                        }
                                    }}
                                >
                                    <Save className="w-4 h-4" /> {savingPaymentSettings ? "Saving..." : "Save Changes"}
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Appearance */}
                    {activeSection === "appearance" && (
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center gap-2 text-base"><Palette className="w-5 h-5 text-orange-500" /> Store Appearance</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Primary Color</Label>
                                        <div className="flex gap-2">
                                            <input type="color" value={appearance.primaryColor} onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })}
                                                className="h-9 w-12 rounded border cursor-pointer" />
                                            <Input value={appearance.primaryColor} onChange={(e) => setAppearance({ ...appearance, primaryColor: e.target.value })} className="font-mono text-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Accent Color</Label>
                                        <div className="flex gap-2">
                                            <input type="color" value={appearance.accentColor} onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })}
                                                className="h-9 w-12 rounded border cursor-pointer" />
                                            <Input value={appearance.accentColor} onChange={(e) => setAppearance({ ...appearance, accentColor: e.target.value })} className="font-mono text-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Font Family</Label>
                                        <Select value={appearance.font} onValueChange={(v) => setAppearance({ ...appearance, font: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="inter">Inter</SelectItem>
                                                <SelectItem value="poppins">Poppins</SelectItem>
                                                <SelectItem value="roboto">Roboto</SelectItem>
                                                <SelectItem value="outfit">Outfit</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Products per Row</Label>
                                        <Select value={appearance.productsPerRow} onValueChange={(v) => setAppearance({ ...appearance, productsPerRow: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="3">3 columns</SelectItem>
                                                <SelectItem value="4">4 columns</SelectItem>
                                                <SelectItem value="5">5 columns</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    {[
                                        { key: "darkMode", label: "Dark Mode", desc: "Enable dark theme for the storefront" },
                                        { key: "showBadges", label: "Show Product Badges", desc: "Display Sale, New, Bestseller badges on product cards" },
                                        { key: "showRatings", label: "Show Star Ratings", desc: "Display product ratings on listing pages" },
                                        { key: "showDiscountTag", label: "Show Discount Tag", desc: "Display % off tag on discounted products" },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                                            <div>
                                                <p className="font-medium text-sm">{item.label}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                            <Switch
                                                checked={appearance[item.key as keyof typeof appearance] as boolean}
                                                onCheckedChange={(v) => setAppearance({ ...appearance, [item.key]: v })}
                                            />
                                        </div>
                                    ))}
                                </div>
                                <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleSave("Appearance")}>
                                    <Save className="w-4 h-4" /> Save Changes
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    {/* Security */}
                    {activeSection === "security" && (
                        <div className="space-y-4">
                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-2 text-base"><Shield className="w-5 h-5 text-orange-500" /> Security Settings</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    {[
                                        { key: "twoFactor", label: "Two-Factor Authentication (2FA)", desc: "Require OTP on every admin login" },
                                        { key: "loginAlerts", label: "Login Alerts", desc: "Email notification for every new login session" },
                                    ].map((item) => (
                                        <div key={item.key} className="flex items-center justify-between py-3 border-b last:border-0">
                                            <div>
                                                <p className="font-medium text-sm">{item.label}</p>
                                                <p className="text-xs text-muted-foreground">{item.desc}</p>
                                            </div>
                                            <Switch
                                                checked={security[item.key as keyof typeof security] as boolean}
                                                onCheckedChange={(v) => setSecurity({ ...security, [item.key]: v })}
                                            />
                                        </div>
                                    ))}
                                    <div className="space-y-1.5 pt-3">
                                        <Label className="font-semibold">Session Timeout (minutes)</Label>
                                        <Input
                                            type="number"
                                            value={security.sessionTimeout}
                                            onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                                            className="max-w-[160px]"
                                        />
                                        <p className="text-xs text-muted-foreground">Admin is auto-logged out after this period of inactivity</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-4">
                                    <CardTitle className="text-base">Change Password</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Current Password</Label>
                                        <Input type="password" value={security.currentPassword} onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })} placeholder="••••••••" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">New Password</Label>
                                        <Input type="password" value={security.newPassword} onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })} placeholder="••••••••" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-semibold">Confirm New Password</Label>
                                        <Input type="password" value={security.confirmPassword} onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })} placeholder="••••••••" />
                                    </div>
                                    <Button
                                        className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                                        onClick={() => {
                                            if (!security.currentPassword || !security.newPassword) {
                                                toast({ title: "Please fill in all password fields", variant: "destructive" });
                                                return;
                                            }
                                            if (security.newPassword !== security.confirmPassword) {
                                                toast({ title: "Passwords do not match", variant: "destructive" });
                                                return;
                                            }
                                            handleSave("Security");
                                            setSecurity({ ...security, currentPassword: "", newPassword: "", confirmPassword: "" });
                                        }}
                                    >
                                        <Save className="w-4 h-4" /> Update Password
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
