// src/controllers/serviceController.js

const ErrorHandler = require("../utils/ErrorHandler.js");
const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse");
const Service = require("../models/services.js");


module.exports.createService = asyncHandler(async (req, res, next) => {

  const newService = await Service.create(req.body);

  sendResponse(res, {
    statusCode: 201, // 201 Created
    message: "Service booking created successfully!",
    data: newService,
  });
});

module.exports.getAllServices = asyncHandler(async (req, res, next) => {
  // --- Filtering ---
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
  

  let query = Service.find(JSON.parse(queryStr));


  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt');
  }


  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v');
  }

  // --- Pagination ---
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Get total count for pagination metadata
  const totalServices = await Service.countDocuments(JSON.parse(queryStr));

  const services = await query;

  if (!services.length && page > 1) {
    return next(new ErrorHandler("This page does not exist.", 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Service bookings fetched successfully!",
    results: services.length,
    pagination: {
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(totalServices / limit),
      totalResults: totalServices,
    },
    data: services,
  });
});

// @desc    Get a single Service Booking by ID
// @route   GET /api/v1/services/:id
// @access  Private (e.g., Admin or specific customer)
module.exports.getService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const service = await Service.findById(id);

  if (!service) {
    return next(new ErrorHandler(`Service booking not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Service booking fetched successfully!",
    data: service,
  });
});

// @desc    Update an existing Service Booking
// @route   PATCH /api/v1/services/:id
// @access  Private (e.g., Admin)
module.exports.updateService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  // Ensure preferredDate is converted if sent
  if (updateData.preferredDate) {
    updateData.preferredDate = new Date(updateData.preferredDate);
  }

  const updatedService = await Service.findByIdAndUpdate(id, updateData, {
    new: true, // Return the updated document
    runValidators: true, // Run schema validators on update
  });

  if (!updatedService) {
    return next(new ErrorHandler(`Service booking not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Service booking updated successfully!",
    data: updatedService,
  });
});

// @desc    Update Service Booking Status
// @route   PATCH /api/v1/services/:id/status
// @access  Private (e.g., Admin, Dealership staff)
module.exports.updateServiceStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // Expects { status: "newStatusValue" }

  if (!status) {
    return next(new ErrorHandler("Status field is required for status update.", 400));
  }

  // Find and update only the status field
  const updatedService = await Service.findByIdAndUpdate(
    id,
    { status: status },
    {
      new: true,
      runValidators: true, // Ensure enum validation runs on status
    }
  );

  if (!updatedService) {
    return next(new ErrorHandler(`Service booking not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: `Service status updated to '${updatedService.status}' successfully!`,
    data: updatedService,
  });
});

// @desc    Delete a Service Booking
// @route   DELETE /api/v1/services/:id
// @access  Private (e.g., Admin)
module.exports.deleteService = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const deletedService = await Service.findByIdAndDelete(id);

  if (!deletedService) {
    return next(new ErrorHandler(`Service booking not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 204, // 204 No Content for successful deletion
    message: "Service booking deleted successfully!",
    data: null,
  });
});


module.exports.totalService = asyncHandler(async (req, res, next) => {
  const contact = await Service.countDocuments({});
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact total",
    data: contact,
  });
});