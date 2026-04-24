import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ImageGalleryProps {
  images: string[];
  title: string;
}

const FALLBACK_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="800" height="800" fill="#f4f4f5"/><rect x="140" y="180" width="520" height="400" rx="28" fill="#e4e4e7"/><path d="M220 520l120-130 90 100 70-70 80 100H220z" fill="#c4c4c8"/><circle cx="320" cy="300" r="38" fill="#d4d4d8"/></svg>'
)}`;

export const ImageGallery = ({ images, title }: ImageGalleryProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const mainImageRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const displayImages =
    images
      .filter((img) => typeof img === "string")
      .map((img) => img.trim())
      .filter((img) => img.length > 0) || [];
  const safeImages = displayImages.length > 0 ? displayImages : [FALLBACK_IMAGE];

  useEffect(() => {
    setActiveIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= safeImages.length) return 0;
      return prev;
    });
  }, [safeImages.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mainImageRef.current || !isZoomed) return;
    const rect = mainImageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handlePrev = () => setActiveIndex((i) => (i === 0 ? safeImages.length - 1 : i - 1));
  const handleNext = () => setActiveIndex((i) => (i === safeImages.length - 1 ? 0 : i + 1));

  // Mobile: swipe slider
  if (isMobile) {
    return (
      <div className="relative w-full">
        <div className="relative overflow-hidden rounded-lg bg-white border border-border/30 flex items-center justify-center" style={{ minHeight: '350px', maxHeight: '400px' }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIndex}
              src={safeImages[activeIndex]}
              alt={`${title} - Image ${activeIndex + 1}`}
              className="max-w-full max-h-[400px] w-auto h-auto object-contain"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </AnimatePresence>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md border border-border/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md border border-border/50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {/* Dot indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {safeImages.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex ? "bg-primary w-8" : "bg-border w-2"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  // Desktop: vertical thumbnails + main image with zoom
  return (
    <div className="flex gap-2">
      {/* Vertical thumbnails */}
      <div className="flex flex-col gap-1 shrink-0">
        {safeImages.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`w-[50px] h-[50px] rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${
              i === activeIndex
                ? "border-primary shadow-md scale-105"
                : "border-border/40 hover:border-primary/50"
            }`}
          >
            <img
              src={img}
              alt={`${title} thumbnail ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
          </button>
        ))}
      </div>

      {/* Main image */}
      <div
        ref={mainImageRef}
        className="relative flex-1 rounded-md overflow-hidden bg-white cursor-crosshair group border border-border/20 flex items-center justify-center"
        style={{ maxHeight: '520px', aspectRatio: '1 / 1' }}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={safeImages[activeIndex]}
            alt={`${title} - Image ${activeIndex + 1}`}
            className="w-full h-full object-contain transition-transform duration-200 p-2"
            style={
              isZoomed
                ? {
                    transform: "scale(2)",
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : {}
            }
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.src = FALLBACK_IMAGE;
            }}
          />
        </AnimatePresence>
        <div className="absolute top-1.5 right-1.5 bg-background/80 backdrop-blur-sm rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <ZoomIn className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};
