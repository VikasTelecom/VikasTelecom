import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductDetail } from "@/data/productDetails";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductTabsProps {
  product: ProductDetail;
}

type TabKey = "description" | "specifications" | "reviews";

const tabs: { key: TabKey; label: string }[] = [
  { key: "description", label: "Description" },
  { key: "specifications", label: "Specifications" },
  { key: "reviews", label: "Reviews" },
];

export const ProductTabs = ({ product }: ProductTabsProps) => {
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const [reviewPage, setReviewPage] = useState(1);
  const isMobile = useIsMobile();
  const reviewsPerPage = 3;

  // Mobile: accordion
  if (isMobile) {
    return (
      <div className="space-y-3">
        {tabs.map((tab) => (
          <div key={tab.key} className="border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveTab(activeTab === tab.key ? activeTab : tab.key)}
              className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.key ? "bg-accent text-accent-foreground" : "bg-background"
              }`}
            >
              {tab.label}
              <motion.span
                animate={{ rotate: activeTab === tab.key ? 180 : 0 }}
                className="text-xs"
              >
                ▼
              </motion.span>
            </button>
            <AnimatePresence>
              {activeTab === tab.key && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="p-4">
                    <TabContent
                      tab={tab.key}
                      product={product}
                      reviewPage={reviewPage}
                      setReviewPage={setReviewPage}
                      reviewsPerPage={reviewsPerPage}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    );
  }

  // Desktop: tabs
  return (
    <div>
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-6 py-3 text-sm font-semibold transition-colors ${
              activeTab === tab.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="tab-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="px-5 py-6 lg:px-6"
        >
          <TabContent
            tab={activeTab}
            product={product}
            reviewPage={reviewPage}
            setReviewPage={setReviewPage}
            reviewsPerPage={reviewsPerPage}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

function TabContent({
  tab,
  product,
  reviewPage,
  setReviewPage,
  reviewsPerPage,
}: {
  tab: TabKey;
  product: ProductDetail;
  reviewPage: number;
  setReviewPage: (p: number) => void;
  reviewsPerPage: number;
}) {
  const specifications = product.specifications || [];
  const reviews = product.reviews || [];
  const ratingBreakdown = (product.ratingBreakdown && product.ratingBreakdown.length > 0)
    ? product.ratingBreakdown
    : [
        { stars: 5, count: 0 },
        { stars: 4, count: 0 },
        { stars: 3, count: 0 },
        { stars: 2, count: 0 },
        { stars: 1, count: 0 },
      ];

  if (tab === "description") {
    return (
      <div className="prose prose-sm max-w-none text-foreground/80 leading-relaxed">
        <p>{product.description}</p>
        <h4 className="text-foreground font-semibold mt-4 mb-2">Key Highlights</h4>
        <ul className="space-y-1">
          {specifications.slice(0, 4).map((s) => (
            <li key={s.feature}>
              <span className="font-medium text-foreground">{s.feature}:</span> {s.value}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (tab === "specifications") {
    return (
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left py-3 px-4 font-semibold text-foreground">Feature</th>
              <th className="text-left py-3 px-4 font-semibold text-foreground">Value</th>
            </tr>
          </thead>
          <tbody>
            {specifications.map((spec, i) => (
              <tr key={spec.feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                <td className="py-3 px-4 font-medium text-foreground/80">{spec.feature}</td>
                <td className="py-3 px-4 text-foreground">{spec.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Reviews
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);
  const paginatedReviews = reviews.slice(
    (reviewPage - 1) * reviewsPerPage,
    reviewPage * reviewsPerPage
  );
  const maxCount = Math.max(...ratingBreakdown.map((r) => r.count), 1);

  return (
    <div>
      {/* Rating summary */}
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="text-center md:text-left">
          <div className="text-5xl font-bold text-foreground">{product.rating}</div>
          <div className="flex items-center justify-center md:justify-start gap-1 mt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.floor(product.rating) ? "fill-primary text-primary" : "text-border"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {product.reviewCount} reviews
          </p>
        </div>
        <div className="flex-1 space-y-2">
          {ratingBreakdown.map((r) => (
            <div key={r.stars} className="flex items-center gap-3">
              <span className="text-sm w-8 text-right text-muted-foreground">{r.stars}★</span>
              <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(r.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="text-sm w-8 text-muted-foreground">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {paginatedReviews.map((review) => (
          <div key={review.id} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                {review.avatar}
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">{review.userName || review.user}</p>
                <p className="text-xs text-muted-foreground">{review.date}</p>
              </div>
              <div className="ml-auto flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < review.rating ? "fill-primary text-primary" : "text-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            <h4 className="font-semibold text-sm text-foreground mb-1">{review.title}</h4>
            <p className="text-sm text-foreground/70 leading-relaxed">{review.comment}</p>
            <button className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-primary transition-colors">
              <ThumbsUp className="w-3.5 h-3.5" />
              Helpful ({review.helpful})
            </button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setReviewPage(Math.max(1, reviewPage - 1))}
            disabled={reviewPage === 1}
            className="p-2 rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setReviewPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                reviewPage === i + 1
                  ? "bg-primary text-primary-foreground"
                  : "border border-border hover:bg-muted"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setReviewPage(Math.min(totalPages, reviewPage + 1))}
            disabled={reviewPage === totalPages}
            className="p-2 rounded-lg border border-border disabled:opacity-30 hover:bg-muted transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
