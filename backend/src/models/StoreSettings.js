const mongoose = require("mongoose");

const storeSettingsSchema = new mongoose.Schema(
	{
		key: { type: String, default: "store", unique: true },
		name: { type: String, default: "Vikash Telecom" },
		tagline: { type: String, default: "India's Best Electronics & Mobile Accessories" },
		email: { type: String, default: "support@vikash.com" },
		phone: { type: String, default: "+91 98765 43210" },
		website: { type: String, default: "www.vikash.com" },
		address: { type: String, default: "123, Tech Park, Pune, Maharashtra 411001" },
		currency: { type: String, enum: ["INR", "USD"], default: "INR" },
		language: { type: String, enum: ["en", "hi"], default: "en" },
		gst: { type: String, default: "27AABCV1234A1Z5" },
		description: {
			type: String,
			default: "Vikash Telecom is a leading online store for electronics, mobile accessories, audio devices, and smart gadgets in India.",
		},
	},
	{ timestamps: true }
);

module.exports = mongoose.model("StoreSettings", storeSettingsSchema);