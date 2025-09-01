// src/controllers/partController.js

const ErrorHandler = require("../utils/ErrorHandler.js");
const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse");
const Part = require("../models/part.js"); // Ensure correct path to your Part model

// @desc    Create a new Parts Request
// @route   POST /api/v1/parts
// @access  Public (or Private if only logged-in users can request parts)
module.exports.createPart = asyncHandler(async (req, res, next) => {
  // Directly create the part request. Mongoose schema validation handles required fields.
  const newPart = await Part.create(req.body);

  sendResponse(res, {
    statusCode: 201, // 201 Created
    message: "Parts request created successfully!",
    data: newPart,
  });
});

// @desc    Get all Parts Requests with Pagination and Sorting
// @route   GET /api/v1/parts
// @access  Private (e.g., Admin or relevant Dealership staff)
module.exports.getAllParts = asyncHandler(async (req, res, next) => {
  // --- Filtering ---
  const queryObj = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(el => delete queryObj[el]);

  // Convert query object to string and then add '$' for Mongoose operators (gte, gt, lte, lt)
  let queryStr = JSON.stringify(queryObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  let query = Part.find(JSON.parse(queryStr));

  // --- Sorting ---
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('-createdAt'); // Default to sorting by newest first
  }

  // --- Field Limiting (Projection) ---
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  } else {
    query = query.select('-__v'); // Exclude __v field by default
  }

  // --- Pagination ---
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  query = query.skip(skip).limit(limit);

  // Get total count for pagination metadata
  const totalParts = await Part.countDocuments(JSON.parse(queryStr));

  const parts = await query;

  if (!parts.length && page > 1) {
    return next(new ErrorHandler("This page does not exist.", 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Parts requests fetched successfully!",
    results: parts.length,
    pagination: {
      currentPage: page,
      limit: limit,
      totalPages: Math.ceil(totalParts / limit),
      totalResults: totalParts,
    },
    data: parts,
  });
});

// @desc    Get a single Parts Request by ID
// @route   GET /api/v1/parts/:id
// @access  Private (e.g., Admin or specific customer)
module.exports.getPart = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const part = await Part.findById(id);

  if (!part) {
    return next(new ErrorHandler(`Parts request not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Parts request fetched successfully!",
    data: part,
  });
});

// @desc    Update an existing Parts Request
// @route   PATCH /api/v1/parts/:id
// @access  Private (e.g., Admin)
module.exports.updatePart = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body;

  // Ensure preferredPickup is converted if sent
  if (updateData.preferredPickup) {
    updateData.preferredPickup = new Date(updateData.preferredPickup);
  }

  const updatedPart = await Part.findByIdAndUpdate(id, updateData, {
    new: true, // Return the updated document
    runValidators: true, // Run schema validators on update
  });

  if (!updatedPart) {
    return next(new ErrorHandler(`Parts request not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Parts request updated successfully!",
    data: updatedPart,
  });
});

// @desc    Update Parts Request Status
// @route   PATCH /api/v1/parts/:id/status
// @access  Private (e.g., Admin, Dealership staff)
module.exports.updatePartStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // Expects { status: "newStatusValue" }

  if (!status) {
    return next(new ErrorHandler("Status field is required for status update.", 400));
  }

  // Find and update only the status field
  const updatedPart = await Part.findByIdAndUpdate(
    id,
    { status: status },
    {
      new: true,
      runValidators: true, // Ensure enum validation runs on status
    }
  );

  if (!updatedPart) {
    return next(new ErrorHandler(`Parts request not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 200,
    message: `Parts request status updated to '${updatedPart.status}' successfully!`,
    data: updatedPart,
  });
});

// @desc    Delete a Parts Request
// @route   DELETE /api/v1/parts/:id
// @access  Private (e.g., Admin)
module.exports.deletePart = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const deletedPart = await Part.findByIdAndDelete(id);

  if (!deletedPart) {
    return next(new ErrorHandler(`Parts request not found with ID: ${id}`, 404));
  }

  sendResponse(res, {
    statusCode: 204, // 204 No Content for successful deletion
    message: "Parts request deleted successfully!",
    data: null,
  });
});