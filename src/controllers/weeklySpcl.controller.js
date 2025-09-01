const ErrorHandler = require("../utils/ErrorHandler.js");
const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse");
const {
  uploadFile,
  destroyFile,
  getPublicIdFromCloudinaryUrl,
} = require("../services/cloudinary.js");
const WeeklySpecial = require("../models/weeklySpcl.js");

module.exports.createWeeklySpecial = asyncHandler(async (req, res, next) => {
  const { title, dealership, description, date } = req.body;
  const files = req.files;

  if (!title || !dealership || !description || !date) {
    return next(
      new ErrorHandler(
        "Please provide title, dealership, description, and date for the weekly special.",
        400
      )
    );
  }

  let thumbnailUrl = "";
  let videoUrl = "";

  if (files && files.thumbnail && files.thumbnail.length > 0) {
    try {
      thumbnailUrl = await uploadFile(files.thumbnail[0]?.path);
    } catch (uploadError) {
      return next(
        new ErrorHandler(`Thumbnail upload failed: ${uploadError.message}`, 500)
      );
    }
  }
  if (files && files.video && files.video.length > 0) {
    try {
      videoUrl = await uploadFile(files.video[0]?.path);
    } catch (uploadError) {
      return next(
        new ErrorHandler(`Video upload failed: ${uploadError.message}`, 500)
      );
    }
  }

  const newSpecial = new WeeklySpecial({
    title,
    dealership,
    thumbnail: thumbnailUrl.url || "",
    video: videoUrl.url || "",
    description,
    date: new Date(date),
  });

  // 5. Save the document
  const createdSpecial = await newSpecial.save();

  // 6. Populate dealership details for the response (if needed by frontend immediately)
  // Assuming your frontend's table still uses `special.dealership` as a string for name,
  // and `dealership` is populated to show the name.
  const populatedSpecial = await WeeklySpecial.findById(
    createdSpecial._id
  ).populate("dealership", "name");

  // 7. Send Response
  sendResponse(res, {
    statusCode: 201,
    message: "Weekly Special created successfully!",
    data: populatedSpecial, // Return the created item
  });
});

module.exports.getAllWeeklySpecials = asyncHandler(async (req, res, next) => {
  // Find all weekly specials
  // Populate the 'dealership' field to get its 'name' for frontend display
  const specials = await WeeklySpecial.find({})
    .populate("dealership", "name") // Only fetch the 'name' field of the dealership
    .sort({ date: -1, createdAt: -1 }); // Sort by date (newest first), then by creation date

  // Handle case where no specials are found (returns empty array)
  if (!specials) {
    return next(new ErrorHandler("No weekly specials found.", 404));
  }

  // Send response
  sendResponse(res, {
    statusCode: 200,
    message: "Weekly Specials fetched successfully!",
    data: specials,
  });
});

module.exports.updateWeeklySpecial = asyncHandler(async (req, res, next) => {
  const { id: specialId } = req.params;
  const { title, dealership, description, date } = req.body;
  const files = req.files;

  if (!specialId) {
    return next(
      new ErrorHandler("Weekly Special ID is required for update.", 400)
    );
  }

  // 1. Find the existing special to get current image/video URLs if not updating
  const existingSpecial = await WeeklySpecial.findById(specialId);
  if (!existingSpecial) {
    return next(
      new ErrorHandler(`Weekly Special not found with ID: ${specialId}`, 404)
    );
  }

  const updateFields = {};

  // 2. Update Text Fields if provided
  if (title !== undefined) updateFields.title = title;
  if (description !== undefined) updateFields.description = description;
  if (date !== undefined) updateFields.date = new Date(date);
  if (dealership !== undefined) updateFields.dealership = dealership; // This should be the ID

  // 3. Handle Thumbnail Update
  if (files && files.thumbnail && files.thumbnail.length > 0) {
    // New thumbnail file uploaded
    try {
      const thumbnailUrl = await uploadFile(files.thumbnail[0]?.path);
      console.log("thumbnil cloudnery",thumbnailUrl)
      updateFields.thumbnail = thumbnailUrl.url;
      // Optional: Delete old thumbnail from Cloudinary if it exists
      if (existingSpecial.thumbnail) {
        const publicId = getPublicIdFromCloudinaryUrl(
          existingSpecial.thumbnail
        );
        console.log("public id ",publicId)
        if (publicId) {
          await destroyFile(publicId).catch((err) =>
            console.warn(`Failed to delete old thumbnail ${publicId}:`, err)
          );
     
        }
      }
    } catch (uploadError) {
      return next(
        new ErrorHandler(`Thumbnail upload failed: ${uploadError.message}`, 500)
      );
    }
  } else if (req.body.thumbnail === "") {
    // Frontend explicitly cleared the thumbnail
    updateFields.thumbnail = ""; // Or null
    // Optional: Delete old thumbnail from Cloudinary
    if (existingSpecial.thumbnail) {
      const publicId = getPublicIdFromCloudinaryUrl(existingSpecial.thumbnail);
      if (publicId) {
        await destroyFile(publicId).catch((err) =>
          console.warn(`Failed to delete old thumbnail ${publicId}:`, err)
        );
      }
    }
  } else if (req.body.thumbnail !== undefined) {
    // Frontend sent back the existing URL (no change to file)
    updateFields.thumbnail = req.body.thumbnail;
  }

  // 4. Handle Video Update (similar logic to thumbnail)
  if (files && files.video && files.video.length > 0) {
    // New video file uploaded
    try {
      const videoUrl = await uploadFile(files.video[0]?.path);
      updateFields.video = videoUrl.url;
      // Optional: Delete old video from Cloudinary
      if (existingSpecial.video) {
        const publicId = getPublicIdFromCloudinaryUrl(existingSpecial.video);
        if (publicId) {
          await destroyFile(publicId).catch((err) =>
            console.warn(`Failed to delete old video ${publicId}:`, err)
          );
        }
      }
    } catch (uploadError) {
      return next(
        new ErrorHandler(`Video upload failed: ${uploadError.message}`, 500)
      );
    }
  } else if (req.body.video === "") {
    // Note: frontend sends 'video' as string when cleared
    // Frontend explicitly cleared the video
    updateFields.video = ""; // Or null
    // Optional: Delete old video from Cloudinary
    if (existingSpecial.video) {
      const publicId = getPublicIdFromCloudinaryUrl(existingSpecial.video);
      if (publicId) {
        await destroyFile(publicId).catch((err) =>
          console.warn(`Failed to delete old video ${publicId}:`, err)
        );
      }
    }
  } else if (req.body.video !== undefined) {
    // frontend sends 'video' as string when kept
    // Frontend sent back the existing URL (no change to file)
    updateFields.video = req.body.video;
  }

  // Ensure there's something to update
  if (
    Object.keys(updateFields).length === 0 &&
    (!files || (!files.thumbnail && !files.video))
  ) {
    return next(new ErrorHandler("No update data or files provided.", 400));
  }

  // 5. Update the document in the database
  const updatedSpecial = await WeeklySpecial.findByIdAndUpdate(
    specialId,
    { $set: updateFields },
    { new: true, runValidators: true } // `new: true` returns the updated doc, `runValidators` runs schema validators
  ).populate("dealership", "name"); // Populate for consistent response structure

  if (!updatedSpecial) {
    return next(
      new ErrorHandler(`Weekly Special not found with ID: ${specialId}`, 404)
    );
  }

  // 6. Send Response
  sendResponse(res, {
    statusCode: 200,
    message: "Weekly Special updated successfully!",
    data: updatedSpecial,
  });
});

module.exports.deleteWeeklySpecial = asyncHandler(async (req, res, next) => {
  const { id: specialId } = req.params;

  if (!specialId) {
    return next(
      new ErrorHandler("Weekly Special ID is required for deletion.", 400)
    );
  }

  // 1. Find the special first to get its media URLs BEFORE deleting it from the DB
  const specialToDelete = await WeeklySpecial.findById(specialId);
  if (!specialToDelete) {
    return next(
      new ErrorHandler(`Weekly Special not found with ID: ${specialId}`, 404)
    );
  }

  // 2. Delete media from Cloudinary
  const mediaToDelete = [];
  if (specialToDelete.thumbnail) {
    mediaToDelete.push(specialToDelete.thumbnail);
  }
  if (specialToDelete.video) {
    mediaToDelete.push(specialToDelete.video);
  }

  const deletionPromises = mediaToDelete.map(async (mediaUrl) => {
    const publicId = getPublicIdFromCloudinaryUrl(mediaUrl);
    if (publicId) {
      try {
        const result = await destroyFile(publicId, {
          resource_type: mediaUrl.includes("/video/") ? "video" : "image",
        });
        console.log(`Cloudinary deletion result for ${publicId}:`, result);
        if (result.result !== "ok") {
          console.warn(
            `Failed to delete Cloudinary asset ${publicId}: ${result.result}`
          );
        }
      } catch (error) {
        console.error(`Error deleting Cloudinary asset ${publicId}:`, error);
      }
    }
  });

  // Wait for all Cloudinary deletions to attempt (they might fail but we still delete the DB record)
  await Promise.allSettled(deletionPromises);

  // 3. Delete the special from the database
  const deletedSpecial = await WeeklySpecial.findByIdAndDelete(specialId);

  // This check is primarily for safety, as we already checked `specialToDelete`
  if (!deletedSpecial) {
    return next(
      new ErrorHandler(
        `Weekly Special not found with ID: ${specialId} during DB deletion.`,
        404
      )
    );
  }

  // 4. Send Response
  sendResponse(res, {
    statusCode: 200,
    message: "Weekly Special and associated media deleted successfully!",
    data: null,
  });
});

module.exports.totalWeekly = asyncHandler(async (req, res, next) => {
  const contact = await WeeklySpecial.countDocuments({});
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact total",
    data: contact,
  });
});