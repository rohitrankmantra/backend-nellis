const mongoose = require("mongoose");

const weeklySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
    },
    thumbnail: {
      type: String,
    },
    video: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("WeeklySpecial", weeklySchema);
