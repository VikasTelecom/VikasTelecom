const mongoose = require("mongoose");

const shippingSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "shipping", unique: true },
    freeShippingAbove: { type: Number, default: 999 },
    standardRate: { type: Number, default: 49 },
    expressRate: { type: Number, default: 99 },
    codAvailable: { type: Boolean, default: true },
    codCharges: { type: Number, default: 29 },
    deliveryDays: { type: String, default: "3-5" },
    returnWindow: { type: Number, default: 7 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShippingSettings", shippingSettingsSchema);
