// src/controllers/businessController.js

const ErrorHandler = require("../utils/ErrorHandler.js");
const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse");
const Business = require("../models/business.js"); 

module.exports.createBusiness = asyncHandler(async (req, res, next) => {
  const newBusiness = await Business.create(req.body);

  sendResponse(res, {
    statusCode: 201, 
    message: "Business created successfully!",
    data: newBusiness,
  });
});

module.exports.getAllBusinesses = asyncHandler(async (req, res, next) => {
  const businesses = await Business.find().sort({ name: 1 });
  // If no businesses are found, return an empty array with a success status.
  if (!businesses.length) {
    return sendResponse(res, {
      statusCode: 200,
      message: "No businesses found.",
      data: [],
    });
  }

  // Send a successful response with the fetched businesses.
  sendResponse(res, {
    statusCode: 200,
    message: "Businesses fetched successfully!",
    results: businesses.length,
    data: businesses,
  });
});

module.exports.getBusiness = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const business = await Business.findById(id);

  if (!business) {
    return next(new ErrorHandler(`Business not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Business fetched successfully!",
    data: business,
  });
});

module.exports.updateBusiness = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  const updatedBusiness = await Business.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  // If the business is not found, return a 404 Not Found error.
  if (!updatedBusiness) {
    return next(new ErrorHandler(`Business not found with ID: ${id}`, 404));
  }

  // Send a successful response with the updated business.
  sendResponse(res, {
    statusCode: 200,
    message: "Business updated successfully!",
    data: updatedBusiness,
  });
});

module.exports.deleteBusiness = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const deletedBusiness = await Business.findByIdAndDelete(id);

  if (!deletedBusiness) {
    return next(new ErrorHandler(`Business not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 204, // 204 No Content
    message: "Business deleted successfully!",
    data: null, // No content in response body for 204
  });
});
