const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productId: { type: String },
    name: { type: String, required: true },
    category: { type: String },
    qty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    image: { type: String },
    variant: {
      sku: { type: String },
      name: { type: String },
      attributes: {
        color: { type: String },
        storage: { type: String },
        ram: { type: String },
        size: { type: String },
      },
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    customerName: { type: String },
    email: { type: String },
    items: [orderItemSchema],
    total: { type: Number, required: true },
    couponCode: { type: String },
    discount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentStatus: { type: String, enum: ["paid", "unpaid", "refunded"], default: "unpaid" },
    paymentProvider: { type: String },
    paymentId: { type: String },
    paymentSessionId: { type: String },
    address: { type: String },
    shippingAddress: {
      name: { type: String },
      phone: { type: String },
      line1: { type: String },
      line2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
