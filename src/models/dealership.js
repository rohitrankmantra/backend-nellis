const mongoose = require("mongoose");

const DealershipSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Dealership name is required"],
    trim: true,
    unique: true,
  },
  coverImage: {
    type: String,
    trim: true,
    default: "",
  },
  logo: {
    type: String,
    trim: true,
    default: "",
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
    trim: true,
    // You might want to add a regex validator for phone number format
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    trim: true,
    lowercase: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please fill a valid email address",
    ],
  },
  website: {
    type: String,
    trim: true,
    default: "",
  },
  services: {
    type: [String], // Array of strings for services
    default: [],
    required: [true, "At least one service is required"],
  },
  specialties: {
    type: [String],
    default: [],
  },
  hours: {
    type: String,
    required: [true, "Business hours are required"],
    trim: true,
  },
  mapUrl: {
    type: String,
    trim: true,
    default: "",
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update `updatedAt` field on save
DealershipSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Dealership", DealershipSchema);

