const express = require("express");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductReview,
} = require("../controllers/productController");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", asyncHandler(listProducts));
router.get("/:idOrSlug", asyncHandler(getProduct));
router.post("/:id/reviews", requireAuth, asyncHandler(addProductReview));
router.post("/", requireAuth, requireAdmin, asyncHandler(createProduct));
router.put("/:id", requireAuth, requireAdmin, asyncHandler(updateProduct));
router.delete("/:id", requireAuth, requireAdmin, asyncHandler(deleteProduct));

module.exports = router;
