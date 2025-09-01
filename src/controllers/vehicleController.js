const ErrorHandler = require("../utils/ErrorHandler.js");
const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse");
const Vehicle = require("../models/vehicle.js"); // Make sure the path is correct
const Dealership = require("../models/dealership.js"); // Assuming you have a Dealership model

// Import your Cloudinary service functions
const {
  uploadFile,
  destroyFile,
  getPublicIdFromCloudinaryUrl,
} = require("../services/cloudinary.js");

module.exports.createVehicle = asyncHandler(async (req, res, next) => {
  const {
    brand,
    model,
    year,
    mileage,
    price,
    exteriorColor,
    interiorColor,
    condition,
    transmission,
    fuelType,
    bodyType,
    engineSize,
    driveTrain,
    numDoors,
    seatingCapacity,
    VIN,
    features,
    description,
    isFeatured,
    status,
    dealership, // This will be the Dealership ObjectId
  } = req.body;

  const files = req.files;

  if (
    !brand ||
    !model ||
    !year ||
    !mileage ||
    !price ||
    !fuelType ||
    !status ||
    !dealership
  ) {
    return next(
      new ErrorHandler(
        "Please provide all required vehicle details: brand, model, year, mileage, price, fuelType, status, and dealership.",
        400
      )
    );
  }

  const existingDealership = await Dealership.findById(dealership);
  if (!existingDealership) {
    return next(
      new ErrorHandler(
        "Invalid dealership ID provided. Dealership not found.",
        400
      )
    );
  }

  let imageUrls = [];
  let videoUrl = "";

  if (files && files.images && files.images.length > 0) {
    for (const imageFile of files.images) {
      try {
        const url = await uploadFile(imageFile.path, "image");
        imageUrls.push(url.url);
      } catch (uploadError) {
        console.error(
          `Error uploading image ${imageFile.originalname}:`,
          uploadError
        );
        return next(
          new ErrorHandler(
            `Image upload failed for ${imageFile.originalname}: ${uploadError.message}`,
            500
          )
        );
      }
    }
  }

  if (files && files.video && files.video.length > 0) {
    try {
      const video1 = await uploadFile(files.video[0].path, "video");

      videoUrl = video1.url;
    } catch (uploadError) {
      console.error(
        `Error uploading video ${files.video[0].originalname}:`,
        uploadError
      );
      return next(
        new ErrorHandler(`Video upload failed: ${uploadError.message}`, 500)
      );
    }
  }

  const newVehicleData = {
    brand,
    model,
    year,
    mileage,
    price,
    exteriorColor,
    interiorColor,
    condition,
    transmission,
    fuelType,
    bodyType,
    engineSize,
    driveTrain,
    numDoors,
    seatingCapacity,
    VIN,
    // Handle `features` which might come as a comma-separated string from FormData
    features: Array.isArray(features)
      ? features
      : features
      ? features.split(",").map((f) => f.trim())
      : [],
    images: imageUrls,
    videoUrl,
    description,
    isFeatured: isFeatured === "true", // Convert string "true"/"false" to boolean
    status,
    dealership, // This will be the ObjectId
  };

  // Create and Save the New Vehicle Document
  const newVehicle = new Vehicle(newVehicleData);
  const createdVehicle = await newVehicle.save();

  // Populate dealership details for the immediate response
  const populatedVehicle = await Vehicle.findById(createdVehicle._id).populate(
    "dealership",
    "name"
  ); // Fetch only the 'name' field of the dealership

  // Send Success Response
  sendResponse(res, {
    statusCode: 201,
    message: "Vehicle created successfully!",
    data: populatedVehicle, // Return the newly created item
  });
});

module.exports.getAllVehicles = asyncHandler(async (req, res, next) => {
  // Find all vehicles and populate the 'dealership' field to get its 'name'
  const vehicles = await Vehicle.find({})
    .populate("dealership", "name")
    .sort({ createdAt: -1 }); // Sort by newest first

  // If no vehicles are found, return a 404
  if (!vehicles.length) {
    return next(new ErrorHandler("No vehicles found.", 404));
  }

  // Send Success Response
  sendResponse(res, {
    statusCode: 200,
    message: "Vehicles fetched successfully!",
    data: vehicles,
  });
});

module.exports.getVehicleById = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Extract ID from URL parameters

  // Find the vehicle by ID and populate dealership name
  const vehicle = await Vehicle.findById(id).populate("dealership", "name");

  // If vehicle is not found, return a 404
  if (!vehicle) {
    return next(new ErrorHandler(`Vehicle not found with ID: ${id}`, 404));
  }

  // Send Success Response
  sendResponse(res, {
    statusCode: 200,
    message: "Vehicle fetched successfully!",
    data: vehicle,
  });
});

module.exports.updateVehicle = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Vehicle ID from URL parameters
  const updateData = req.body; // Text fields from the request body
  const files = req.files; // Files from Multer: { images: [...], video: [...] }

  if (!id) {
    return next(new ErrorHandler("Vehicle ID is required for update.", 400));
  }

  // Find the existing vehicle to access its current media URLs for deletion later
  const existingVehicle = await Vehicle.findById(id);
  if (!existingVehicle) {
    return next(new ErrorHandler(`Vehicle not found with ID: ${id}`, 404));
  }

  // --- Handle `features` field ---
  // Ensure `features` is an array; convert if it comes as a comma-separated string
  if (updateData.features !== undefined) {
    updateData.features = Array.isArray(updateData.features)
      ? updateData.features
      : updateData.features
      ? updateData.features.split(",").map((f) => f.trim())
      : [];
  }

  // --- Convert `isFeatured` string to boolean ---
  if (updateData.isFeatured !== undefined) {
    updateData.isFeatured = updateData.isFeatured === "true";
  }

  // --- Handle Images Update ---
  if (files && files.images && files.images.length > 0) {
    const newImageUrls = [];
    for (const imageFile of files.images) {
      try {
        const url = await uploadFile(imageFile.path, "image");
        newImageUrls.push(url.url);
      } catch (uploadError) {
        console.error(
          `Error uploading new image ${imageFile.originalname}:`,
          uploadError
        );
        return next(
          new ErrorHandler(
            `New image upload failed: ${uploadError.message}`,
            500
          )
        );
      }
    }
    // Delete all old images from Cloudinary after successful new uploads
    await Promise.allSettled(
      existingVehicle.images.map(async (url) => {
        const publicId = getPublicIdFromCloudinaryUrl(url);
        if (publicId)
          await destroyFile(publicId, "image").catch((err) =>
            console.warn(`Failed to delete old image ${publicId}:`, err.message)
          );
      })
    );
    updateData.images = newImageUrls; // Set new image URLs
  } else if (
    updateData.images === "" ||
    (Array.isArray(updateData.images) && updateData.images.length === 0)
  ) {
    // If frontend explicitly cleared all images (sent empty string or empty array)
    await Promise.allSettled(
      existingVehicle.images.map(async (url) => {
        const publicId = getPublicIdFromCloudinaryUrl(url);
        if (publicId)
          await destroyFile(publicId, "image").catch((err) =>
            console.warn(`Failed to delete old image ${publicId}:`, err.message)
          );
      })
    );
    updateData.images = []; // Clear image URLs in DB
  }
  // If `files.images` is empty and `updateData.images` is not an empty string/array,
  // it means the frontend sent back the existing URLs, so no change is needed to `updateData.images`.

  // --- Handle Video Update ---
  if (files && files.video && files.video.length > 0) {
    // New video file uploaded
    try {
      const video1 = await uploadFile(files.video[0].path, "video");
      updateData.videoUrl = video1.url;
      // Delete old video from Cloudinary if it exists
      if (existingVehicle.videoUrl) {
        const publicId = getPublicIdFromCloudinaryUrl(existingVehicle.videoUrl);
        if (publicId)
          await destroyFile(publicId, "video").catch((err) =>
            console.warn(`Failed to delete old video ${publicId}:`, err.message)
          );
      }
    } catch (uploadError) {
      console.error(
        `Error uploading new video ${files.video[0].originalname}:`,
        uploadError
      );
      return next(
        new ErrorHandler(`New video upload failed: ${uploadError.message}`, 500)
      );
    }
  } else if (updateData.videoUrl === "") {
    // If frontend explicitly cleared the video (sent empty string)
    if (existingVehicle.videoUrl) {
      const publicId = getPublicIdFromCloudinaryUrl(existingVehicle.videoUrl);
      if (publicId)
        await destroyFile(publicId, "video").catch((err) =>
          console.warn(`Failed to delete old video ${publicId}:`, err.message)
        );
    }
    updateData.videoUrl = ""; // Clear video URL in DB
  }
  // Similar to images, if `files.video` is empty and `updateData.videoUrl` is not an empty string,
  // the existing URL is kept.

  // --- Update the Vehicle Document in the Database ---
  const updatedVehicle = await Vehicle.findByIdAndUpdate(
    id,
    { $set: updateData }, // Use $set to only update provided fields
    { new: true, runValidators: true } // `new: true` returns the updated document; `runValidators` ensures schema validation on update
  ).populate("dealership", "name"); // Populate for a consistent response structure

  // If the vehicle was not found by ID after the update attempt (unlikely if `existingVehicle` was found)
  if (!updatedVehicle) {
    return next(
      new ErrorHandler(
        `Vehicle not found with ID: ${id} after update attempt.`,
        404
      )
    );
  }

  // Send Success Response
  sendResponse(res, {
    statusCode: 200,
    message: "Vehicle updated successfully!",
    data: updatedVehicle,
  });
});

module.exports.deleteVehicle = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Vehicle ID from URL parameters

  if (!id) {
    return next(new ErrorHandler("Vehicle ID is required for deletion.", 400));
  }

  // Find the vehicle first to get its media URLs BEFORE deleting it from the DB
  const vehicleToDelete = await Vehicle.findById(id);
  if (!vehicleToDelete) {
    return next(new ErrorHandler(`Vehicle not found with ID: ${id}`, 404));
  }

  // --- Collect all Media URLs for Deletion from Cloudinary ---
  const mediaDeletionPromises = [];

  // Delete associated images
  for (const imageUrl of vehicleToDelete.images) {
    const publicId = getPublicIdFromCloudinaryUrl(imageUrl);
    if (publicId) {
      // Add the promise to the array; destroyFile is expected to handle resource type
      mediaDeletionPromises.push(
        destroyFile(publicId, "image").catch((err) =>
          console.warn(`Failed to delete image ${publicId}:`, err.message)
        )
      );
    }
  }

  // Delete associated video
  if (vehicleToDelete.videoUrl) {
    const publicId = getPublicIdFromCloudinaryUrl(vehicleToDelete.videoUrl);
    if (publicId) {
      // Add the promise to the array
      mediaDeletionPromises.push(
        destroyFile(publicId, "video").catch((err) =>
          console.warn(`Failed to delete video ${publicId}:`, err.message)
        )
      );
    }
  }

  // Execute all Cloudinary deletions concurrently.
  // `Promise.allSettled` ensures all promises run, even if some fail,
  // preventing a single failure from stopping the entire deletion process.
  await Promise.allSettled(mediaDeletionPromises);
  // Errors during Cloudinary deletion are warned in console but do not block DB deletion,
  // as the primary goal is to remove the vehicle record from the system.

  // --- Delete the Vehicle Document from the Database ---
  const deletedVehicle = await Vehicle.findByIdAndDelete(id);

  // This check is primarily for safety, as we already checked `vehicleToDelete`
  if (!deletedVehicle) {
    return next(
      new ErrorHandler(
        `Vehicle not found with ID: ${id} during DB deletion.`,
        404
      )
    );
  }

  // Send Success Response
  sendResponse(res, {
    statusCode: 200,
    message: "Vehicle and associated media deleted successfully!",
    data: null, // No data returned on deletion success
  });
});

module.exports.totalVehicle = asyncHandler(async (req, res, next) => {
  const contact = await Vehicle.countDocuments({});
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact total",
    data: contact,
  });
});
