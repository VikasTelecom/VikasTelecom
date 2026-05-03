const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    userName: { type: String, trim: true },
    avatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String },
    title: { type: String },
    comment: { type: String },
    helpful: { type: Number, default: 0 },
  },
  { _id: false }
);

const specificationSchema = new mongoose.Schema(
  {
    feature: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const ratingBreakdownSchema = new mongoose.Schema(
  {
    stars: { type: Number, required: true },
    count: { type: Number, required: true },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String },
    name: { type: String },
    image: { type: String },
    hoverImage: { type: String },
    price: { type: Number },
    mrp: { type: Number },
    discount: { type: Number },
    stock: { type: Number },
    attributes: {
      color: { type: String },
      storage: { type: String },
      ram: { type: String },
      size: { type: String },
    },
    images: [{ type: String }],
    specifications: [specificationSchema],
    status: { type: String, enum: ["active", "draft", "out_of_stock"], default: "active" },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    generalName: { type: String, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    image: { type: String, required: true },
    hoverImage: { type: String },
    price: { type: Number, required: true },
    mrp: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    badge: { type: String, enum: ["sale", "new", "bestseller"] },
    category: { type: String, required: true },
    brand: { type: String },
    ram: { type: String },
    storage: { type: String },
    battery: { type: String },
    has5G: { type: Boolean },
    type: { type: String },
    compatibility: { type: String },
    inStock: { type: Boolean },
    description: { type: String },
    images: [{ type: String }],
    variants: [variantSchema],
    specifications: [specificationSchema],
    availability: { type: String, enum: ["In Stock", "Out of Stock", "Limited Stock"], default: "In Stock" },
    emi: { type: String },
    deliveryInfo: { type: String },
    returnPolicy: { type: String },
    reviews: [reviewSchema],
    ratingBreakdown: [ratingBreakdownSchema],
    stock: { type: Number, default: 0 },
    status: { type: String, enum: ["active", "draft", "out_of_stock"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
