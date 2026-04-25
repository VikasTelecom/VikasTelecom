const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    expirationDate,
    usageLimit,
    applicabilityType = "all",
    applicabilityValue,
    applicabilityLabel,
  } = req.body;

  const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
  if (couponExists) {
    res.status(400);
    throw new Error("Coupon already exists");
  }

  if (["brand", "category", "product"].includes(applicabilityType) && !String(applicabilityValue || "").trim()) {
    res.status(400);
    throw new Error("Coupon applicability target is required");
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    discountType,
    discountValue,
    minPurchase,
    maxDiscount,
    expirationDate,
    usageLimit,
    applicabilityType,
    applicabilityValue: applicabilityValue ? String(applicabilityValue).trim() : undefined,
    applicabilityLabel: applicabilityLabel ? String(applicabilityLabel).trim() : undefined,
  });

  res.status(201).json(coupon);
});

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  res.json(coupons);
});

// @desc    Delete a coupon
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    await coupon.deleteOne();
    res.json({ message: "Coupon removed" });
  } else {
    res.status(404);
    throw new Error("Coupon not found");
  }
});

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Public
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal, cartItems = [] } = req.body;

  const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

  if (!coupon) {
    res.status(404);
    throw new Error("Invalid coupon code");
  }

  if (new Date() > coupon.expirationDate) {
    res.status(400);
    throw new Error("Coupon has expired");
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error("Coupon usage limit reached");
  }

  if (cartTotal < coupon.minPurchase) {
    res.status(400);
    throw new Error(`Minimum purchase amount of ₹${coupon.minPurchase} required`);
  }

  if (coupon.applicabilityType && coupon.applicabilityType !== "all") {
    const normalizedItems = Array.isArray(cartItems) ? cartItems : [];
    const productIds = normalizedItems
      .map((item) => String(item.productId || "").trim())
      .filter(Boolean);

    let productsById = new Map();
    const validObjectIds = productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (validObjectIds.length > 0) {
      const matchedProducts = await Product.find({ _id: { $in: validObjectIds } }).select("_id brand category");
      productsById = new Map(matchedProducts.map((product) => [String(product._id), product]));
    }

    const couponTarget = String(coupon.applicabilityValue || "").trim();
    const hasMatchingItem = normalizedItems.some((item) => {
      const productId = String(item.productId || "").trim();
      const matchedProduct = productsById.get(productId);

      const itemBrand = String(item.brand || matchedProduct?.brand || "").trim().toLowerCase();
      const itemCategory = String(item.category || matchedProduct?.category || "").trim().toLowerCase();

      if (coupon.applicabilityType === "product") {
        return productId && productId === couponTarget;
      }

      if (coupon.applicabilityType === "brand") {
        return itemBrand && itemBrand === couponTarget.toLowerCase();
      }

      if (coupon.applicabilityType === "category") {
        return itemCategory && itemCategory === couponTarget.toLowerCase();
      }

      return false;
    });

    if (!hasMatchingItem) {
      res.status(400);
      const scopeLabel = coupon.applicabilityLabel || coupon.applicabilityValue || coupon.applicabilityType;
      throw new Error(`This coupon is only valid for ${coupon.applicabilityType}: ${scopeLabel}`);
    }
  }

  let discountAmount = 0;
  if (coupon.discountType === "percentage") {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  // Ensure discount doesn't exceed cart total
  discountAmount = Math.min(discountAmount, cartTotal);

  res.json({
    coupon: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discountAmount,
    applicabilityType: coupon.applicabilityType,
    applicabilityValue: coupon.applicabilityValue,
    applicabilityLabel: coupon.applicabilityLabel,
  });
});

module.exports = {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  validateCoupon,
};
