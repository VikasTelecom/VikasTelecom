const mongoose = require("mongoose");

const paymentSettingsSchema = new mongoose.Schema(
  {
    upiEnabled: { type: Boolean, default: true },
    codEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PaymentSettings", paymentSettingsSchema);