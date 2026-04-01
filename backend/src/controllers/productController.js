const mongoose = require("mongoose");
const Product = require("../models/Product");
const slugify = require("../utils/slugify");

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

  return res.json({ product });
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

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
