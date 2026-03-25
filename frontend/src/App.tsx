import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CategoriesProvider } from "@/contexts/CategoriesContext";
import Index from "./pages/Index";
import AudioCategory from "./pages/AudioCategory";
import ChargingCategory from "./pages/ChargingCategory";
import SmartDevicesCategory from "./pages/SmartDevicesCategory";
import AccessoriesCategory from "./pages/AccessoriesCategory";
import MobilesCategory from "./pages/MobilesCategory";
import MobileAccessoriesCategory from "./pages/MobileAccessoriesCategory";
import CategorySlug from "./pages/CategorySlug";
import BrandPage from "./pages/BrandPage";
import ProductDetails from "./pages/ProductDetails";
import Support from "./pages/Support";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Checkout from "./pages/Checkout";
import CheckoutSuccess from "./pages/CheckoutSuccess";
import CheckoutCancel from "./pages/CheckoutCancel";
import CartPage from "./pages/Cart";
import OrdersPage from "./pages/Orders";
import NotFound from "./pages/NotFound";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminProtectedRoute from "@/pages/admin/AdminProtectedRoute";
import Dashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/Products";
import AdminOrders from "@/pages/admin/Orders";
import AdminCategories from "@/pages/admin/Categories";
import AdminBrands from "@/pages/admin/Brands";
import AdminCoupons from "@/pages/admin/Coupons";
import AdminUsers from "@/pages/admin/Users";
import AdminReviews from "@/pages/admin/Reviews";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminSettings from "@/pages/admin/Settings";

const queryClient = new QueryClient();

function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return (
    <div className={!isAdmin ? "pb-mobile-nav" : undefined}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/collections/audio" element={<AudioCategory />} />
        <Route path="/collections/charging" element={<ChargingCategory />} />
        <Route path="/collections/smart-devices" element={<SmartDevicesCategory />} />
        <Route path="/collections/accessories" element={<AccessoriesCategory />} />
        <Route path="/mobiles" element={<MobilesCategory />} />
        <Route path="/mobile-accessories" element={<MobileAccessoriesCategory />} />
        <Route path="/categories/:slug" element={<CategorySlug />} />
        <Route path="/brands/:slug" element={<BrandPage />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/support" element={<Support />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/checkout/success" element={<CheckoutSuccess />} />
        <Route path="/checkout/cancel" element={<CheckoutCancel />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="brands" element={<AdminBrands />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      {!isAdmin && <MobileBottomNav />}
      {!isAdmin && <WhatsAppButton />}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CategoriesProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AppContent />
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
        </CategoriesProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;