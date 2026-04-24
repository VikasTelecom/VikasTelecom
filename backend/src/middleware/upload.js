const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../uploads/banners");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeExt = ext || ".jpg";
    const uniqueName = `banner-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.toLowerCase().startsWith("image/")) {
      const error = new Error("Only image files are allowed");
      error.status = 400;
      return cb(error);
    }

    return cb(null, true);
  },
});

module.exports = upload;
