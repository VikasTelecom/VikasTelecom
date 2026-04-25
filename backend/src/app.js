const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const { Readable } = require("stream");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const orderRoutes = require("./routes/orderRoutes");
const userRoutes = require("./routes/userRoutes");
const cartRoutes = require("./routes/cartRoutes");
const addressRoutes = require("./routes/addressRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const couponRoutes = require("./routes/couponRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const { notFound, errorHandler } = require("./middleware/error");

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const IMAGE_PROXY_ALLOWED_HOSTS = new Set(["evmzone.com", "www.evmzone.com"]);

app.get("/api/image-proxy", async (req, res) => {
  const rawUrl = String(req.query.url || "").trim();
  if (!rawUrl) {
    return res.status(400).json({ message: "Image URL is required" });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({ message: "Invalid image URL" });
  }

  if (!/^https?:$/i.test(parsedUrl.protocol)) {
    return res.status(400).json({ message: "Only http/https image URLs are supported" });
  }

  if (!IMAGE_PROXY_ALLOWED_HOSTS.has(parsedUrl.hostname.toLowerCase())) {
    return res.status(403).json({ message: "Host is not allowed for image proxy" });
  }

  try {
    const upstream = await fetch(parsedUrl.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return res.status(502).json({ message: "Failed to fetch image" });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    if (!contentType.toLowerCase().startsWith("image/")) {
      return res.status(502).json({ message: "Upstream response is not an image" });
    }

    const cacheControl = upstream.headers.get("cache-control") || "public, max-age=86400";
    const contentLength = upstream.headers.get("content-length");

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", cacheControl);
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    Readable.fromWeb(upstream.body).pipe(res);
  } catch (error) {
    return res.status(502).json({ message: "Unable to proxy image" });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payment", paymentRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
