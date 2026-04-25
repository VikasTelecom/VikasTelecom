const Cart = require("../models/Cart");
const Order = require("../models/Order");
const Address = require("../models/Address");
const PaymentSettings = require("../models/PaymentSettings");

const DEFAULT_PAYMENT_SETTINGS = {
  upiEnabled: true,
  codEnabled: true,
};

const getPublicPaymentSettings = async (req, res) => {
  const settings = await PaymentSettings.findOne().lean();

  if (!settings) {
    return res.json(DEFAULT_PAYMENT_SETTINGS);
  }

  return res.json({
    upiEnabled: settings.upiEnabled,
    codEnabled: settings.codEnabled,
  });
};

// Direct payment - creates order with paid status
const processDirectPayment = async (req, res) => {
  const { addressId, items, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);

  if (!total) {
    return res.status(400).json({ message: "Order total is required" });
  }

  const address = addressId ? await Address.findOne({ _id: addressId, user: req.user._id }) : null;

  const order = await Order.create({
    user: req.user._id,
    customerName: req.user.name,
    email: req.user.email,
    items: items.map((item) => ({
      product: item.product,
      productId: item.productId,
      name: item.name,
      category: item.category,
      qty: item.qty || item.quantity,
      price: item.price,
      image: item.image,
      variant: item.variant,
    })),
    total,
    status: "processing",
    paymentStatus: "paid",
    paymentProvider: paymentMethod || "cash_on_delivery",
    address: addressId || "",
    shippingAddress: address
      ? {
          name: address.name,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        }
      : undefined,
  });

  // Clear user's cart after order creation
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  return res.status(201).json({ order, message: "Order placed successfully" });
};

module.exports = {
  processDirectPayment,
  getPublicPaymentSettings,
};
