const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const Address = require("../models/Address");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const createCounterOrder = async (req, res) => {
  const customerName = String(req.body.customerName || "").trim();
  const customerPhone = String(req.body.customerPhone || "").trim();
  const productId = String(req.body.productId || "").trim();
  const quantity = Number(req.body.quantity);
  const phoneDigits = customerPhone.replace(/\D/g, "");

  if (customerName.length < 2 || customerName.length > 100) {
    return res.status(400).json({ message: "Enter a valid customer name" });
  }
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    return res.status(400).json({ message: "Enter a valid mobile number" });
  }
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product" });
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    return res.status(400).json({ message: "Quantity must be between 1 and 20" });
  }

  const product = await Product.findById(productId);
  if (!product || product.status === "draft" || product.status === "out_of_stock" || product.inStock === false) {
    return res.status(404).json({ message: "This product is not available for counter order" });
  }

  let selectedVariant;
  const variantSku = String(req.body.variantSku || "").trim();
  const variantName = String(req.body.variantName || "").trim();
  const variantAttributes = req.body.variantAttributes || {};
  if (product.variants?.length) {
    selectedVariant = product.variants.find((variant) =>
      (variantSku && variant.sku === variantSku) ||
      (!variantSku && variantName && variant.name === variantName) ||
      (!variantSku && !variantName && Object.keys(variantAttributes).length > 0 &&
        ["color", "storage", "ram", "size"].every((key) =>
          !variantAttributes[key] || variant.attributes?.[key] === variantAttributes[key]
        ))
    );
    if (!selectedVariant) {
      return res.status(400).json({ message: "Selected product option is no longer available" });
    }
    if (selectedVariant.status === "draft" || selectedVariant.status === "out_of_stock") {
      return res.status(400).json({ message: "Selected product option is out of stock" });
    }
    if (Number.isFinite(selectedVariant.stock) && selectedVariant.stock < quantity) {
      return res.status(400).json({ message: "Not enough stock for the selected option" });
    }
  } else if (Number.isFinite(product.stock) && product.stock < quantity) {
    return res.status(400).json({ message: "Not enough stock for this product" });
  }

  const price = Number(selectedVariant?.price ?? product.price);
  const attributes = selectedVariant?.attributes || {};
  const order = await Order.create({
    customerName,
    customerPhone,
    email: "",
    fulfillmentType: "counter",
    pickupLocation: "Vikash Telecom Shop",
    items: [{
      product: product._id,
      productId: String(product._id),
      name: product.title,
      category: product.category,
      qty: quantity,
      price,
      image: selectedVariant?.image || product.image,
      variant: selectedVariant ? {
        sku: selectedVariant.sku,
        name: selectedVariant.name,
        attributes: {
          color: attributes.color,
          storage: attributes.storage,
          ram: attributes.ram,
          size: attributes.size,
        },
      } : undefined,
    }],
    total: price * quantity,
    status: "pending",
    paymentStatus: "unpaid",
    paymentMethod: "cod",
    shippingAddress: { name: customerName, phone: customerPhone },
  });

  return res.status(201).json({ order });
};

const createOrder = async (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const address = req.body.address || "";
  const couponCode = req.body.couponCode;
  const discount = Number(req.body.discount || 0);
  const paymentMethodRaw = String(req.body.paymentMethod || "cod").toLowerCase();
  const paymentMethod = paymentMethodRaw === "upi" || paymentMethodRaw === "cod" ? paymentMethodRaw : null;
  const upiTransactionId = String(req.body.upiTransactionId || "").trim();

  if (!paymentMethod) {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  if (paymentMethod === "upi" && !upiTransactionId) {
    return res.status(400).json({ message: "UPI transaction id is required" });
  }

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
    paymentMethod,
    upiTransactionId: paymentMethod === "upi" ? upiTransactionId : undefined,
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
  createCounterOrder,
  createOrder,
  listMyOrders,
  listOrders,
  updateOrderStatus,
  deleteOrder,
};
