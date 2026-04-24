import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";

const defaultSlides = [
  {
    id: 1,
    title: "Premium Audio Experience",
    subtitle: "Discover our latest collection of wireless speakers & earbuds",
    cta: "Shop Now",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=600&fit=crop",
    gradient: "from-foreground/70 via-foreground/40 to-transparent",
  },
  {
    id: 2,
    title: "Smart Charging Solutions",
    subtitle: "Fast, reliable, and designed for your lifestyle",
    cta: "Explore",
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1400&h=600&fit=crop",
    gradient: "from-foreground/70 via-foreground/40 to-transparent",
  },
  {
    id: 3,
    title: "New Smartwatch Collection",
    subtitle: "Track your fitness goals with style and precision",
    cta: "View Collection",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1400&h=600&fit=crop",
    gradient: "from-foreground/70 via-foreground/40 to-transparent",
  },
];

const SLIDE_COUNT = defaultSlides.length;

export const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState(defaultSlides);

  const next = useCallback(() => setCurrent((p) => (p + 1) % SLIDE_COUNT), []);
  const prev = useCallback(() => setCurrent((p) => (p - 1 + SLIDE_COUNT) % SLIDE_COUNT), []);

  useEffect(() => {
    api
      .fetchHomeHeroBanners()
      .then((images) => {
        if (!images.length) return;

        setSlides(
          defaultSlides.map((slide, idx) => ({
            ...slide,
            image: images[idx] || slide.image,
          }))
        );
      })
      .catch(() => {
        // Keep default images if banner API fails.
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-muted">
      <AnimatePresence mode="wait">
        <motion.div
          key={slides[current].id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slides[current].gradient}`} />
          <div className="absolute inset-0 flex items-center">
            <div className="container-main">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="max-w-xl"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-background mb-4 leading-tight">
                  {slides[current].title}
                </h1>
                <p className="text-background/80 text-sm sm:text-base md:text-lg mb-6 max-w-md">
                  {slides[current].subtitle}
                </p>
                <button className="px-8 py-3.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-all duration-200 hover:scale-105">
                  {slides[current].cta}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center hover:bg-background/40 transition-colors text-background">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/20 backdrop-blur-sm flex items-center justify-center hover:bg-background/40 transition-colors text-background">
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-primary" : "w-2 bg-background/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
};
