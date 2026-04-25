const express = require("express");
const { processDirectPayment, getPublicPaymentSettings } = require("../controllers/paymentController");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/settings", asyncHandler(getPublicPaymentSettings));
router.post("/process", requireAuth, asyncHandler(processDirectPayment));

module.exports = router;
