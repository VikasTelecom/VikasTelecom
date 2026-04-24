const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: ["home_hero"],
    },
    images: [{ type: String, trim: true }],
    titles: [{ type: String, trim: true }],
    subtitles: [{ type: String, trim: true }],
    ctas: [{ type: String, trim: true }],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
