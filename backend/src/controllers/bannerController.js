const Banner = require("../models/Banner");

const HOME_HERO_KEY = "home_hero";

const DEFAULT_HOME_HERO_IMAGES = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1400&h=600&fit=crop",
];

const sanitizeImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 10);
};

const getHomeHeroBanners = async (req, res) => {
  const banner = await Banner.findOne({ key: HOME_HERO_KEY }).lean();
  const images = sanitizeImages(banner?.images);

  return res.json({
    images: images.length ? images : DEFAULT_HOME_HERO_IMAGES,
  });
};

const updateHomeHeroBanners = async (req, res) => {
  const images = sanitizeImages(req.body?.images);

  if (!images.length) {
    return res.status(400).json({ message: "At least one banner image is required" });
  }

  const banner = await Banner.findOneAndUpdate(
    { key: HOME_HERO_KEY },
    {
      $set: {
        key: HOME_HERO_KEY,
        images,
        updatedBy: req.user?.id,
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    }
  );

  return res.json({
    message: "Hero banner images updated",
    images: banner.images,
  });
};

const uploadHeroBannerImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  return res.status(201).json({
    message: "Banner image uploaded",
    image: `/uploads/banners/${req.file.filename}`,
  });
};

module.exports = {
  getHomeHeroBanners,
  updateHomeHeroBanners,
  uploadHeroBannerImage,
};
