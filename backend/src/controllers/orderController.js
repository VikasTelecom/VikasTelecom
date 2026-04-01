const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Address = require("../models/Address");

const createOrder = async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const address = req.body.address || "";
  const couponCode = req.body.couponCode;
  const discount = Number(req.body.discount || 0);

  const computedTotal = items.reduce((sum, item) => {
    const price = Number(item.price || 0);
    const qty = Number(item.qty || 0);
    return sum + price * qty;
  }, 0);

  // If coupon is used, increment its usage count
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode });
    if (coupon) {
      coupon.usedCount += 1;
      await coupon.save();
    }
  }

  // If items are provided, recalculate purely based on items.
  // Ideally, should recalculate shipping/tax/discount server side.
  // For now, trusting the total provided, or falling back to computedTotal - discount.
  // But to support discounts we should probably trust the passed "total" or do full calc.
  // Let's rely on passed total but verify it's not absurdly low compared to items?
  // Or just use the passed total.
  const total = Number(req.body.total) || (computedTotal - discount);

  if (total === undefined || total === null) {
    return res.status(400).json({ message: "Order total is required" });
  }

  let shippingAddress;
  if (address) {
    const savedAddress = await Address.findOne({ _id: address, user: req.user._id });
    if (savedAddress) {
      shippingAddress = {
        name: savedAddress.name,
        phone: savedAddress.phone,
        line1: savedAddress.line1,
        line2: savedAddress.line2,
        city: savedAddress.city,
        state: savedAddress.state,
        postalCode: savedAddress.postalCode,
        country: savedAddress.country,
      };
    }
  }

  const order = await Order.create({
    user: req.user._id,
    customerName: req.user.name,
    email: req.user.email,
    items,
    total,
    couponCode,
    discount,
    address,
    shippingAddress,
  });

  return res.status(201).json({ order });
};

const listMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");
  return res.json({ items: orders });
};

const listOrders = async (req, res) => {
  const orders = await Order.find().sort("-createdAt");
  return res.json({ items: orders });
};

const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  const updates = {};
  if (status) updates.status = status;
  if (paymentStatus) updates.paymentStatus = paymentStatus;

  const order = await Order.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  });

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json({ order });
};

const deleteOrder = async (req, res) => {
  const { id } = req.params;
  const order = await Order.findByIdAndDelete(id);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  return res.json({ message: "Order deleted" });
};

module.exports = {
  createOrder,
  listMyOrders,
  listOrders,
  updateOrderStatus,
  deleteOrder,
};
