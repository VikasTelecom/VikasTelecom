const express = require("express");
const { getHomeHeroBanners } = require("../controllers/bannerController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/home-hero", asyncHandler(getHomeHeroBanners));

module.exports = router;
