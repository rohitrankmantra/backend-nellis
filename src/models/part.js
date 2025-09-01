// src/models/Part.js

const mongoose = require("mongoose");

const partSchema = new mongoose.Schema(
  {
    name: {
      // Customer's name
      type: String,
      required: [true, "Customer name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long."],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
      match: [
        /^\+?\d{10,15}$/,
        "Please fill a valid phone number (e.g., +12345678900 or 1234567890).",
      ],
    },
    email: {
      type: String,
      required: [true, "Email address is required."],
      lowercase: true,
      trim: true,
      match: [/\S+@\S+\.\S+/, "Please fill a valid email address."],
    },
    vehicleYear: {
      type: Number,
      required: [true, "Vehicle year is required."],
      min: [1900, "Vehicle year cannot be before 1900."],
      max: [
        new Date().getFullYear() + 1,
        "Vehicle year cannot be in the future.",
      ],
    },
    make: {
      type: String,
      required: [true, "Vehicle make is required."],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Vehicle model is required."],
      trim: true,
    },
    VIN: {
      type: String,
      trim: true,
      uppercase: true, // VINs are typically uppercase
    },
    partsNeeded: {
      type: [String], // Or [String] if you want to store multiple parts in an array
      required: [true, "Parts needed description is required."],
      trim: true,
    },
    preferredPickup: {
      type: Date,
      required: [true, "Preferred pickup date is required."],
    },
    preferredPickupOption: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      required: true,
    },
    // Optional: Reference to a user or dealership if this parts request is linked
    // customerId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'User',
    // },
    // dealershipId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: 'Dealership',
    // },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt fields
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

module.exports = mongoose.model("Part", partSchema);
