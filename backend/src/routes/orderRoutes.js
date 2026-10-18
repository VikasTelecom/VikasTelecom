const express = require("express");
const {
  createCounterOrder,
  createOrder,
  listMyOrders,
  listOrders,
  updateOrderStatus,
  deleteOrder,
} = require("../controllers/orderController");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.post("/counter", asyncHandler(createCounterOrder));
router.post("/", requireAuth, asyncHandler(createOrder));
router.get("/me", requireAuth, asyncHandler(listMyOrders));
router.get("/", requireAuth, requireAdmin, asyncHandler(listOrders));
router.put("/:id/status", requireAuth, requireAdmin, asyncHandler(updateOrderStatus));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteOrder));

module.exports = router;
