// src/models/SpecialOffer.js

const mongoose = require("mongoose");

const specialOfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    tag: {
      type: String,
    },
    offer: {
      type: String,
    },
    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
      required: true,
    },
    image: {
      type: String,
    },
    validUntil: {
      type: Date,
    },
    termsConditions: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("SpecialOffer", specialOfferSchema);
