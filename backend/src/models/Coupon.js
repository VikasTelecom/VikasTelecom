const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discountValue: { type: Number, required: true },
    minPurchase: { type: Number, default: 0 },
    maxDiscount: { type: Number }, // Only applicable for percentage
    expirationDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 1000 },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    applicabilityType: {
      type: String,
      enum: ["all", "brand", "category", "product"],
      default: "all",
    },
    applicabilityValue: { type: String, trim: true },
    applicabilityLabel: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
