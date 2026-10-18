const express = require("express");
const {
	getAdminAnalytics,
	getStoreSettings,
	updateStoreSettings,
	getPaymentSettings,
	updatePaymentSettings,
} = require("../controllers/adminController");
const { updateHomeHeroBanners, uploadHeroBannerImage } = require("../controllers/bannerController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/analytics", requireAuth, requireAdmin, asyncHandler(getAdminAnalytics));
router.get("/store-settings", requireAuth, requireAdmin, asyncHandler(getStoreSettings));
router.put("/store-settings", requireAuth, requireAdmin, asyncHandler(updateStoreSettings));
router.get("/payment-settings", requireAuth, requireAdmin, asyncHandler(getPaymentSettings));
router.put("/payment-settings", requireAuth, requireAdmin, asyncHandler(updatePaymentSettings));
router.put("/hero-banners", requireAuth, requireAdmin, asyncHandler(updateHomeHeroBanners));
router.post("/hero-banners/upload", requireAuth, requireAdmin, upload.single("image"), asyncHandler(uploadHeroBannerImage));

module.exports = router;
