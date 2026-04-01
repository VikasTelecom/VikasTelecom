const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  return res.json({ cart: cart || { user: req.user._id, items: [] } });
};

const addItem = async (req, res) => {
  const { productId, quantity = 1, variant } = req.body;

  if (!productId) {
    return res.status(400).json({ message: "Product is required" });
  }

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id, items: [] } },
    { new: true, upsert: true }
  );

  const normalizeVariant = (value) => {
    if (!value) return null;
    return {
      sku: value.sku || null,
      name: value.name || null,
      attributes: {
        color: value.attributes?.color || null,
        storage: value.attributes?.storage || null,
        ram: value.attributes?.ram || null,
        size: value.attributes?.size || null,
      },
    };
  };

  const incomingVariant = normalizeVariant(variant);
  const existing = cart.items.find((item) => {
    if (item.product.toString() !== productId) return false;
    const itemVariant = normalizeVariant(item.variant);
    return JSON.stringify(itemVariant) === JSON.stringify(incomingVariant);
  });

  if (existing) {
    existing.quantity += Number(quantity);
  } else {
    cart.items.push({
      product: product._id,
      productId: product.id || product._id.toString(),
      name: product.title,
      image: product.image,
      category: product.category,
      quantity: Number(quantity),
      price: product.price,
      variant,
    });
  }

  await cart.save();
  return res.status(201).json({ cart });
};

const updateItem = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  const qty = Number(quantity);
  if (qty <= 0) {
    cart.items.pull(itemId);
  } else {
    item.quantity = qty;
  }

  await cart.save();
  return res.json({ cart });
};

const removeItem = async (req, res) => {
  const { itemId } = req.params;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  cart.items.pull(itemId);
  await cart.save();
  return res.json({ cart });
};

const clearCart = async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { $set: { items: [] } },
    { new: true }
  );

  return res.json({ cart: cart || { user: req.user._id, items: [] } });
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
};
