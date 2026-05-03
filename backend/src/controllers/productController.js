const mongoose = require("mongoose");
const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const slugify = require("../utils/slugify");

const looksLikeObjectId = (value) => {
  return Boolean(value && /^[a-f\d]{24}$/i.test(String(value).trim()));
};

const getInitial = (name) => {
  const trimmed = String(name || "").trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "";
};

const buildUniqueSlug = async (baseSlug, excludeId) => {
  let slug = baseSlug;
  let counter = 1;

  while (await Product.exists({ slug, _id: { $ne: excludeId } })) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return slug;
};

const normalizeImageList = (...values) => {
  const normalized = values
    .flatMap((value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "string") {
        return value
          .split(/\r?\n|,/)
          .map((entry) => entry.trim())
          .filter(Boolean);
      }
      return [];
    })
    .map((value) => (typeof value === "string" ? value.trim() : value))
    .filter(Boolean);

  return [...new Set(normalized)];
};

const normalizeVariant = (variant = {}) => {
  const images = normalizeImageList(
    variant.images,
    variant.gallery,
    variant.image,
    variant.hoverImage
  );

  return {
    ...variant,
    images: images.length > 0 ? images : undefined,
    image: variant.image || images[0],
    hoverImage: variant.hoverImage || images[1],
  };
};

const normalizeProductPayload = (payload = {}) => {
  const images = normalizeImageList(payload.images, payload.image, payload.hoverImage);
  const variants = Array.isArray(payload.variants)
    ? payload.variants.map((variant) => normalizeVariant(variant))
    : [];

  return {
    ...payload,
    images: images.length > 0 ? images : undefined,
    image: payload.image || images[0],
    hoverImage: payload.hoverImage || images[1],
    variants,
  };
};

const listProducts = async (req, res) => {
  const {
    q,
    category,
    brand,
    badge,
    minRating,
    has5G,
    ram,
    storage,
    type,
    compatibility,
    inStock,
    minPrice,
    maxPrice,
    sort,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = {};

  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
      { brand: { $regex: q, $options: "i" } },
    ];
  }

  if (category) {
    filter.category = category;
  }

  if (brand) {
    filter.brand = brand;
  }

  if (badge) {
    filter.badge = badge;
  }

  if (minRating) {
    filter.rating = { $gte: Number(minRating) };
  }

  if (has5G !== undefined) {
    filter.has5G = has5G === "true" || has5G === true;
  }

  if (ram) {
    filter.ram = ram;
  }

  if (storage) {
    filter.storage = storage;
  }

  if (type) {
    filter.type = type;
  }

  if (compatibility) {
    filter.compatibility = compatibility;
  }

  if (inStock !== undefined) {
    if (inStock === "true" || inStock === true) {
      filter.stock = { $gt: 0 };
    }
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const pageNumber = Math.max(Number(page) || 1, 1);
  const requestedLimit = Number(limit) || 12;
  const pageSize = Math.max(1, Math.min(requestedLimit, 500));

  const sortOption = sort ? sort.replace(/:/g, " ") : "-createdAt";

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Product.countDocuments(filter),
  ]);

  return res.json({
    items,
    page: pageNumber,
    pages: Math.ceil(total / pageSize),
    total,
  });
};

const getProduct = async (req, res) => {
  const { idOrSlug } = req.params;

  let product = null;

  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    product = await Product.findById(idOrSlug);
  }

  if (!product) {
    product = await Product.findOne({ slug: idOrSlug });
  }

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const plain = product.toObject({ virtuals: false });
  const reviews = Array.isArray(plain.reviews) ? plain.reviews : [];
  const missingNames = reviews.filter((review) => !review.userName && looksLikeObjectId(review.user));
  const userIds = [...new Set(missingNames.map((review) => String(review.user)))]
    .filter(Boolean);

  let nameById = new Map();
  if (userIds.length > 0) {
    const users = await User.find({ _id: { $in: userIds } }).select("name");
    nameById = new Map(users.map((user) => [String(user._id), user.name]));
  }

  plain.reviews = reviews.map((review, index) => {
    const resolvedName = review.userName || nameById.get(String(review.user)) || "";
    return {
      ...review,
      id: review.id || `${String(review.user || "anon")}-${String(review.date || index)}`,
      userName: resolvedName || undefined,
      avatar: review.avatar || getInitial(resolvedName) || undefined,
    };
  });

  return res.json({ product: plain });
};

const createProduct = async (req, res) => {
  const payload = normalizeProductPayload({ ...req.body });

  if (!payload.title && payload.name) {
    payload.title = payload.name;
  }

  if (!payload.title) {
    return res.status(400).json({ message: "Title is required" });
  }

  const baseSlug = payload.slug ? slugify(payload.slug) : slugify(payload.title);
  payload.slug = await buildUniqueSlug(baseSlug);

  const product = await Product.create(payload);
  return res.status(201).json({ product });
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const updates = normalizeProductPayload({ ...req.body });

  if (!updates.title && updates.name) {
    updates.title = updates.name;
  }

  if (updates.title && !updates.slug) {
    const baseSlug = slugify(updates.title);
    updates.slug = await buildUniqueSlug(baseSlug, id);
  }

  const product = await Product.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ product });
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ message: "Product removed" });
};

const addProductReview = async (req, res) => {
  const { id } = req.params;
  const rating = Number(req.body.rating);
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const comment = typeof req.body.comment === "string" ? req.body.comment.trim() : "";

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const userId = String(req.user?._id || "");
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const hasDeliveredOrder = await Order.exists({
    user: req.user._id,
    status: "delivered",
    $or: [
      { "items.product": product._id },
      { "items.productId": String(product._id) },
    ],
  });

  if (!hasDeliveredOrder) {
    return res.status(403).json({ message: "You can rate this product only after delivery" });
  }

  const alreadyReviewed = Array.isArray(product.reviews)
    ? product.reviews.some((review) => String(review.user) === userId)
    : false;

  if (alreadyReviewed) {
    return res.status(409).json({ message: "You have already reviewed this product" });
  }

  product.reviews = Array.isArray(product.reviews) ? product.reviews : [];
  product.reviews.push({
    user: userId,
    userName: req.user?.name || undefined,
    avatar: getInitial(req.user?.name) || undefined,
    rating,
    date: new Date().toISOString(),
    title: title || undefined,
    comment: comment || undefined,
  });

  const ratings = product.reviews.map((review) => Number(review.rating || 0)).filter((val) => Number.isFinite(val) && val > 0);
  const reviewCount = ratings.length;
  const avgRating = reviewCount ? ratings.reduce((sum, val) => sum + val, 0) / reviewCount : 0;

  product.reviewCount = reviewCount;
  product.rating = Number(avgRating.toFixed(1));

  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((val) => {
    const rounded = Math.round(val);
    if (rounded >= 1 && rounded <= 5) counts[rounded] += 1;
  });

  product.ratingBreakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: counts[stars],
  }));

  await product.save();
  return res.status(201).json({ product });
};

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
};
