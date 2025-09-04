const mongoose = require("mongoose");

const gallerySchema = new mongoose.Schema(
  {
    image: {
      url: {
        type: String,
        required: [true, "Image URL is required"],
      },
      public_id: {
        type: String,
        required: [true, "Public ID is required"],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "Admin",
      required: true,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsed: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Gallery", gallerySchema);
