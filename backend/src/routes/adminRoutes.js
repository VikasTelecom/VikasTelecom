const express = require("express");
const { getAdminAnalytics } = require("../controllers/adminController");
const { updateHomeHeroBanners, uploadHeroBannerImage } = require("../controllers/bannerController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/analytics", requireAuth, requireAdmin, asyncHandler(getAdminAnalytics));
router.put("/hero-banners", requireAuth, requireAdmin, asyncHandler(updateHomeHeroBanners));
router.post("/hero-banners/upload", requireAuth, requireAdmin, upload.single("image"), asyncHandler(uploadHeroBannerImage));

module.exports = router;
