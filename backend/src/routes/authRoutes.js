const express = require("express");
const { register, login, me, updateMe, forgotPassword, resetPassword } = require("../controllers/authController");
const { googleAuth } = require("../controllers/googleController");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/google", asyncHandler(googleAuth));
router.get("/me", requireAuth, asyncHandler(me));
router.put("/me", requireAuth, asyncHandler(updateMe));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.post("/reset-password/:token", asyncHandler(resetPassword));

module.exports = router;
