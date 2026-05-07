import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";
import { HeroSlider } from "@/components/home/HeroSlider";
import { CategoryGrid } from "@/components/home/CategoryGrid";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { PromoBanner } from "@/components/home/PromoBanner";
import { BestSellers, NewArrivalsSection } from "@/components/home/BestSellers";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CartDrawer />
      <main>
        <HeroSlider />
        <CategoryGrid />
        <FeaturedProducts />
        <PromoBanner />
        <BestSellers />
        <NewArrivalsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
