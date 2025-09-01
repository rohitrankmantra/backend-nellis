const ErrorHandler = require("../utils/ErrorHandler.js");
const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse");
const {
  uploadFile,
  destroyFile,
  getPublicIdFromCloudinaryUrl,
} = require("../services/cloudinary.js");
const SpecialOffer = require("../models/specialOffer.js"); // Ensure this path is correct
const Dealership = require("../models/dealership.js"); // Assuming you have a Dealership model

module.exports.createSpecialOffer = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    tag,
    dealership,
    validUntil,
    termsConditions,
    offer,
  } = req.body;
  const imageFile = req.files; // From multer's `upload.single('image')`

  // 1. Basic Input Validation
  if (!title || !description || !dealership) {
    return next(
      new ErrorHandler(
        "Please provide title, description, and dealership for the special offer.",
        400
      )
    );
  }

  // 2. Validate Dealership ID existence (important for data integrity)
  const existingDealership = await Dealership.findById(dealership);
  if (!existingDealership) {
    return next(
      new ErrorHandler(
        "Invalid Dealership ID provided. Dealership not found.",
        400
      )
    );
  }

  let imageUrl = "";

  if (imageFile) {
    try {
      const imageUrlx = await uploadFile(imageFile.image[0].path, "image");
      imageUrl = imageUrlx.url;
    } catch (uploadError) {
      console.error("Cloudinary image upload failed:", uploadError);
      return next(
        new ErrorHandler(`Image upload failed: ${uploadError.message}`, 500)
      );
    }
  }

  // 4. Create New Special Offer Document
  const newOffer = new SpecialOffer({
    title,
    description,
    tag,
    offer,
    dealership, // This is the ObjectId
    image: imageUrl, // Store the Cloudinary URL
    validUntil: validUntil ? new Date(validUntil) : undefined, // Convert to Date object
    termsConditions,
  });

  // 5. Save the document
  const createdOffer = await newOffer.save();

  // 6. Populate dealership details for the response
  const populatedOffer = await SpecialOffer.findById(createdOffer._id).populate(
    "dealership",
    "name"
  );

  // 7. Send Success Response
  sendResponse(res, {
    statusCode: 201, // 201 Created
    message: "Special Offer created successfully!",
    data: populatedOffer, // Return the newly created item
  });
});

module.exports.getAllSpecialOffers = asyncHandler(async (req, res, next) => {
  // Find all special offers and populate the 'dealership' field to get its 'name'
  const specialOffers = await SpecialOffer.find({})
    .populate("dealership", "name") // Only fetch the 'name' field of the dealership
    .sort({ createdAt: -1 }); // Sort by newest first, or by `validUntil`

  // If no offers are found, return an empty array (or 404 if no offers is an error for your app)
  if (!specialOffers.length) {
    // You might return an empty array with 200 OK, or 404 No Content
    return sendResponse(res, {
      statusCode: 200,
      message: "No special offers found.",
      data: [],
    });
  }

  // Send Success Response
  sendResponse(res, {
    statusCode: 200,
    message: "Special Offers fetched successfully!",
    data: specialOffers,
  });
});

module.exports.getSpecialOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params; // Extract ID from URL parameters

  // Find the special offer by ID and populate dealership name
  const specialOffer = await SpecialOffer.findById(id).populate(
    "dealership",
    "name"
  );

  // If special offer is not found, return a 404
  if (!specialOffer) {
    return next(
      new ErrorHandler(`Special Offer not found with ID: ${id}`, 404)
    );
  }

  // Send Success Response
  sendResponse(res, {
    statusCode: 200,
    message: "Special Offer fetched successfully!",
    data: specialOffer,
  });
});

module.exports.updateSpecialOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body; // Text fields from the request body
  const imageFile = req.files; // New image file, if uploaded

  if (!id) {
    return next(
      new ErrorHandler("Special Offer ID is required for update.", 400)
    );
  }

  // 1. Find the existing special offer to get its current image URL for deletion
  const existingOffer = await SpecialOffer.findById(id);
  if (!existingOffer) {
    return next(
      new ErrorHandler(`Special Offer not found with ID: ${id}`, 404)
    );
  }

  // 2. Handle Image Update
  if (imageFile) {
    // New image file uploaded
    try {
      const imagex = await uploadFile(imageFile.image[0].path, "image"); // Upload new image
      updateData.image = imagex.url;
      // Delete old image from Cloudinary if it exists
      if (existingOffer.image) {
        const publicId = getPublicIdFromCloudinaryUrl(existingOffer.image);
        if (publicId) {
          await destroyFile(publicId, "image").catch((err) =>
            console.warn(`Failed to delete old image ${publicId}:`, err.message)
          );
        }
      }
    } catch (uploadError) {
      console.error(
        "Cloudinary image upload failed during update:",
        uploadError
      );
      return next(
        new ErrorHandler(`Image upload failed: ${uploadError.message}`, 500)
      );
    }
  } else if (updateData.image === "") {
    // Frontend explicitly cleared the image (sent empty string)
    if (existingOffer.image) {
      const publicId = getPublicIdFromCloudinaryUrl(existingOffer.image);
      if (publicId) {
        await destroyFile(publicId, "image").catch((err) =>
          console.warn(`Failed to delete old image ${publicId}:`, err.message)
        );
      }
    }
    updateData.image = ""; // Clear image URL in DB
  }
  // If `imageFile` is null/undefined and `updateData.image` is not an empty string,
  // it means the frontend sent back the existing URL (no change to file), so no action needed.

  // 3. Convert `validUntil` to Date object if provided
  if (updateData.validUntil) {
    updateData.validUntil = new Date(updateData.validUntil);
  }

  // 4. Update the document in the database
  const updatedOffer = await SpecialOffer.findByIdAndUpdate(
    id,
    { $set: updateData }, // Use $set to only update provided fields
    { new: true, runValidators: true } // `new: true` returns the updated doc, `runValidators` ensures schema validation
  ).populate("dealership", "name"); // Populate for consistent response structure

  if (!updatedOffer) {
    return next(
      new ErrorHandler(
        `Special Offer not found with ID: ${id} after update attempt.`,
        404
      )
    );
  }

  // 5. Send Success Response
  sendResponse(res, {
    statusCode: 200,
    message: "Special Offer updated successfully!",
    data: updatedOffer,
  });
});

module.exports.deleteSpecialOffer = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(
      new ErrorHandler("Special Offer ID is required for deletion.", 400)
    );
  }

  // 1. Find the special offer first to get its image URL BEFORE deleting it from the DB
  const offerToDelete = await SpecialOffer.findById(id);
  if (!offerToDelete) {
    return next(
      new ErrorHandler(`Special Offer not found with ID: ${id}`, 404)
    );
  }

  // 2. Delete associated image from Cloudinary
  if (offerToDelete.image) {
    const publicId = getPublicIdFromCloudinaryUrl(offerToDelete.image);
    if (publicId) {
      try {
        // `destroyFile` is expected to handle resource type (image for offers)
        const result = await destroyFile(publicId, "image");
        console.log(`Cloudinary deletion result for ${publicId}:`, result);
        if (result && result.result !== "ok") {
          console.warn(
            `Failed to delete Cloudinary asset ${publicId}: ${result.result}`
          );
        }
      } catch (error) {
        console.error(`Error deleting Cloudinary asset ${publicId}:`, error);
        // Do not return error here; proceed to delete from DB even if Cloudinary fails
      }
    }
  }

  // 3. Delete the special offer from the database
  const deletedOffer = await SpecialOffer.findByIdAndDelete(id);

  // This check is primarily for safety, as we already checked `offerToDelete`
  if (!deletedOffer) {
    return next(
      new ErrorHandler(
        `Special Offer not found with ID: ${id} during DB deletion.`,
        404
      )
    );
  }

  // 4. Send Success Response (204 No Content is standard for successful DELETE)
  sendResponse(res, {
    statusCode: 204, // 204 No Content
    message: "Special Offer and associated image deleted successfully!",
    data: null, // No content in response body for 204
  });
});
