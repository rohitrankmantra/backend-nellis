// src/models/Service.js

const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long."],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
    
    },
    email: {
      type: String,
      required: [true, "Email address is required."],
      lowercase: true,
      trim: true,
  
    },
    vehicleYear: {
      type: Number,
      required: [true, "Vehicle year is required."],
    
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
    serviceNeeded: {
      type: String,
      required: [true, "Service needed description is required."],
      trim: true,
    },
    preferredDate: {
      type: Date,
      required: [true, "Preferred date is required."],
      min: [new Date(), "Preferred date cannot be in the past."], // Ensures future or present date
    },
    preferredTime: {
      type: String, // Store as string (e.g., "09:00 AM", "2:30 PM")
      required: [true, "Preferred time is required."],
      trim: true,
      // You might add a custom validator here for time format (e.g., HH:MM AM/PM)
    },
    additionalNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Additional notes cannot exceed 500 characters."],
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending",
      required: true,
    },
    // Optional: Reference to a user or dealership if this service is linked
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

// Prevent Mongoose from overwriting the model if it's already compiled
module.exports =  mongoose.model("Service", serviceSchema);