const express = require("express");
const { getHomeHeroBanners } = require("../controllers/bannerController");
const { updateHomeHeroBanners, uploadHeroBannerImage } = require("../controllers/bannerController");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const upload = require("../middleware/upload");

const router = express.Router();

router.get("/home-hero", asyncHandler(getHomeHeroBanners));
router.put("/home-hero", requireAuth, requireAdmin, asyncHandler(updateHomeHeroBanners));
router.post("/home-hero/upload", requireAuth, requireAdmin, upload.single("image"), asyncHandler(uploadHeroBannerImage));

module.exports = router;
