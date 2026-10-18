const Product = require("../models/Product");
const Order = require("../models/Order");
const User = require("../models/User");
const PaymentSettings = require("../models/PaymentSettings");
const StoreSettings = require("../models/StoreSettings");

const buildLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date,
      day: date.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }
  return days;
};

const getAdminAnalytics = async (req, res) => {
  const [totalProducts, totalOrders, totalUsers] = await Promise.all([
    Product.countDocuments(),
    Order.countDocuments(),
    User.countDocuments(),
  ]);

  const paidRevenueAgg = await Order.aggregate([
    { $match: { paymentStatus: { $in: ["paid", "unpaid"] }, status: { $ne: "cancelled" } } },
    { $group: { _id: null, total: { $sum: "$total" } } },
  ]);

  const totalRevenue = paidRevenueAgg[0]?.total || 0;

  const recentOrders = await Order.find().sort("-createdAt").limit(5);

  const days = buildLast7Days();
  const salesData = days.map((day) => ({ day: day.day, revenue: 0, orders: 0 }));

  const lastWeekOrders = await Order.find({
    createdAt: { $gte: days[0].date },
  });

  lastWeekOrders.forEach((order) => {
    const idx = days.findIndex((d) => d.date.toDateString() === order.createdAt.toDateString());
    if (idx >= 0) {
      salesData[idx].revenue += order.total;
      salesData[idx].orders += 1;
    }
  });

  const categoryAgg = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.category",
        sales: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        units: { $sum: "$items.qty" },
      },
    },
    { $sort: { sales: -1 } },
  ]);

  const categorySales = categoryAgg.map((item) => ({
    category: item._id || "Uncategorized",
    sales: item.sales,
    units: item.units,
  }));

  const topProductsAgg = await Order.aggregate([
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.name",
        revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } },
        units: { $sum: "$items.qty" },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 5 },
  ]);

  const topProducts = topProductsAgg.map((item) => ({
    name: item._id,
    revenue: item.revenue,
    units: item.units,
    growth: 0,
  }));

  return res.json({
    stats: {
      totalProducts,
      totalOrders,
      totalRevenue,
      totalUsers,
    },
    salesData,
    recentOrders,
    categorySales,
    topProducts,
  });
};

const defaultPaymentSettings = {
  upiEnabled: true,
  codEnabled: true,
};

const defaultStoreSettings = {
  name: "Vikash Telecom",
  tagline: "India's Best Electronics & Mobile Accessories",
  email: "support@vikash.com",
  phone: "+91 98765 43210",
  website: "www.vikash.com",
  address: "123, Tech Park, Pune, Maharashtra 411001",
  currency: "INR",
  language: "en",
  gst: "27AABCV1234A1Z5",
  description: "Vikash Telecom is a leading online store for electronics, mobile accessories, audio devices, and smart gadgets in India.",
};

const getStoreSettings = async (_req, res) => {
  const settings = await StoreSettings.findOne({ key: "store" }).lean();
  return res.json({ ...defaultStoreSettings, ...(settings || {}) });
};

const updateStoreSettings = async (req, res) => {
  const body = req.body || {};
  const payload = Object.fromEntries(
    Object.entries(defaultStoreSettings).map(([key, fallback]) => [
      key,
      typeof body[key] === "string" ? body[key].trim() : fallback,
    ])
  );

  if (!["INR", "USD"].includes(payload.currency) || !["en", "hi"].includes(payload.language)) {
    return res.status(400).json({ message: "Invalid currency or language" });
  }

  const settings = await StoreSettings.findOneAndUpdate(
    { key: "store" },
    { $set: payload },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

  return res.json({ message: "Store settings updated", settings: { ...defaultStoreSettings, ...settings } });
};

const getPaymentSettings = async (req, res) => {
  const settings = await PaymentSettings.findOne();
  if (!settings) {
    return res.json(defaultPaymentSettings);
  }

  return res.json({
    upiEnabled: settings.upiEnabled,
    codEnabled: settings.codEnabled,
  });
};

const updatePaymentSettings = async (req, res) => {
  const payload = {
    upiEnabled: Boolean(req.body.upiEnabled),
    codEnabled: Boolean(req.body.codEnabled),
  };

  let settings = await PaymentSettings.findOne();
  if (!settings) {
    settings = await PaymentSettings.create(payload);
  } else {
    Object.assign(settings, payload);
    await settings.save();
  }

  return res.json({
    message: "Payment settings updated",
    settings: {
      upiEnabled: settings.upiEnabled,
      codEnabled: settings.codEnabled,
    },
  });
};

module.exports = {
  getAdminAnalytics,
  getStoreSettings,
  updateStoreSettings,
  getPaymentSettings,
  updatePaymentSettings,
};
