const Banner = require("../models/Banner");

const HOME_HERO_KEY = "home_hero";

const DEFAULT_HOME_HERO_IMAGES = [
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=1400&h=600&fit=crop",
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1400&h=600&fit=crop",
];

const DEFAULT_HOME_HERO_TITLES = [
  "Premium Audio Experience",
  "Smart Charging Solutions",
  "New Smartwatch Collection",
];

const DEFAULT_HOME_HERO_SUBTITLES = [
  "Discover our latest collection of wireless speakers & earbuds",
  "Fast, reliable, and designed for your lifestyle",
  "Track your fitness goals with style and precision",
];

const DEFAULT_HOME_HERO_CTAS = ["Shop Now", "Explore", "View Collection"];
const DEFAULT_HOME_HERO_TEXT_COLORS = ["#FFFFFF", "#FFFFFF", "#FFFFFF"];

const sanitizeImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 10);
};

const sanitizeTexts = (values) => {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .slice(0, 10);
};

const sanitizeColors = (values) => {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => String(value || "").trim())
    .filter((value) => /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value))
    .slice(0, 10);
};

const getHomeHeroBanners = async (req, res) => {
  const banner = await Banner.findOne({ key: HOME_HERO_KEY }).lean();
  const images = sanitizeImages(banner?.images);
  const titles = sanitizeTexts(banner?.titles);
  const subtitles = sanitizeTexts(banner?.subtitles);
  const ctas = sanitizeTexts(banner?.ctas);
  const textColors = sanitizeColors(banner?.textColors);

  return res.json({
    images: images.length ? images : DEFAULT_HOME_HERO_IMAGES,
    titles: titles.length ? titles : DEFAULT_HOME_HERO_TITLES,
    subtitles: subtitles.length ? subtitles : DEFAULT_HOME_HERO_SUBTITLES,
    ctas: ctas.length ? ctas : DEFAULT_HOME_HERO_CTAS,
    textColors: textColors.length ? textColors : DEFAULT_HOME_HERO_TEXT_COLORS,
  });
};

const updateHomeHeroBanners = async (req, res) => {
  const images = sanitizeImages(req.body?.images);
  const titles = sanitizeTexts(req.body?.titles);
  const subtitles = sanitizeTexts(req.body?.subtitles);
  const ctas = sanitizeTexts(req.body?.ctas);
  const textColors = sanitizeColors(req.body?.textColors);

  if (!images.length) {
    return res.status(400).json({ message: "At least one banner image is required" });
  }

  if (!titles.length || !subtitles.length || !ctas.length) {
    return res.status(400).json({ message: "Hero banner title, subtitle and button text are required" });
  }

  const banner = await Banner.findOneAndUpdate(
    { key: HOME_HERO_KEY },
    {
      $set: {
        key: HOME_HERO_KEY,
        images,
        titles,
        subtitles,
        ctas,
        textColors: textColors.length ? textColors : DEFAULT_HOME_HERO_TEXT_COLORS,
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
    message: "Hero banners updated",
    images: banner.images,
    titles: banner.titles || [],
    subtitles: banner.subtitles || [],
    ctas: banner.ctas || [],
    textColors: banner.textColors || [],
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
