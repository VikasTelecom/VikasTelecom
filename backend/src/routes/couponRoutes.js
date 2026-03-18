const express = require("express");
const router = express.Router();
const {
  createCoupon,
  getAllCoupons,
  deleteCoupon,
  validateCoupon,
} = require("../controllers/couponController");
const { requireAuth, requireAdmin } = require("../middleware/auth");

router.route("/").post(requireAuth, requireAdmin, createCoupon).get(requireAuth, requireAdmin, getAllCoupons);
router.route("/validate").post(validateCoupon);
router.route("/:id").delete(requireAuth, requireAdmin, deleteCoupon);

module.exports = router;
