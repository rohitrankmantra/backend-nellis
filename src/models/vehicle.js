// src/models/Vehicle.js (Renamed from vehical.js for correct spelling)

const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    brand: {
      type: String,
      required: [true, "Vehicle brand is required."],
      trim: true,
    },
    model: {
      type: String,
      required: [true, "Vehicle model is required."],
      trim: true,
    },
    VIN: {
      type: String,
    },
    year: {
      type: Number,
      required: [true, "Manufacturing year is required."],
      min: 1900,
      max: new Date().getFullYear() + 2,
    },
    mileage: {
      type: Number,
      required: [true, "Mileage (in miles or kilometers) is required."],
      min: 0,
    },

    price: {
      type: Number,
      required: [true, "Price is required."],
      min: 0,
    },
    exteriorColor: {
      type: String,
      trim: true,
    },
    interiorColor: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
    },
    transmission: {
      type: String,
    },
    fuelType: {
      type: String,
    },
    bodyType: {
      type: String,
    },
    engineSize: {
      type: String,
      trim: true,
    },
    driveTrain: {
      type: String,
      // enum: ['FWD', 'RWD', 'AWD', '4x4'],
    },
    numDoors: {
      type: Number,
    },
    seatingCapacity: {
      type: Number,
    },

    features: {
      type: [String],
      default: [],
    },
    images: {
      type: [String],
      default: [],
    },
    videoUrl: {
      type: String,
    },
    description: {
      // Detailed description of the vehicle
      type: String,
      trim: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Available", "Sold", "Pending", "Coming Soon", "Reserved"],
      default: "Available",
      required: true,
    },
    dealership: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dealership",
      required: [true, "Vehicle must be associated with a dealership."], // Enforce association
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Vehicle", vehicleSchema); // Renamed model to Vehicle
