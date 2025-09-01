const ErrorHandler = require("../utils/ErrorHandler.js");
const asyncHandler = require("../utils/asyncHandler.js");
const sendResponse = require("../utils/sendResponse");
const { uploadFile, destroyFile } = require("../services/cloudinary.js");
const Dealership = require("../models/dealership.js");

module.exports.getAllDealerships = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const skip = (page - 1) * limit;

  const dealerships = await Dealership.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Dealership.countDocuments({});

  const totalPages = Math.ceil(totalCount / limit);

  sendResponse(res, {
    statusCode: 200,
    message: "Dealerships fetched successfully",
    data: dealerships,
    pagination: {
      currentPage: page,
      limit: limit,
      totalPages: totalPages,
      totalItems: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  });
});

module.exports.updateDealership = asyncHandler(async (req, res, next) => {
  const { id: dealershipId } = req.params;
  const {
    name,
    address,
    phone,
    email,
    website,
    services,
    specialties,
    hours,
    mapUrl,
    description,
  } = req.body;
  const files = req.files; // This will be an object like { logo: [file], coverImage: [file] }

  if (!dealershipId) {
    return next(new ErrorHandler("Dealership ID is required for update", 400));
  }

  const updateData = {};

  if (name !== undefined) updateData.name = name;
  if (address !== undefined) updateData.address = address;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (website !== undefined) updateData.website = website;
  if (hours !== undefined) updateData.hours = hours;
  if (mapUrl !== undefined) updateData.mapUrl = mapUrl;
  if (description !== undefined) updateData.description = description;
  const servicesArray = services
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);
  const specialtiesArray = specialties
    ? specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s)
    : [];

  updateData.services = servicesArray;
  updateData.specialties = specialtiesArray;

  if (files && files.logo && files.logo.length > 0) {
    const logoUrl = await uploadFile(files.logo[0]?.path);
    updateData.logo = logoUrl.url;
  } else if (req.body.logo === "") {
    updateData.logo = "";
  } else if (req.body.logo !== undefined) {
    updateData.logo = req.body.logo;
  }

  if (files && files.coverImage && files.coverImage.length > 0) {
    const coverImageUrl = await uploadFile(files.coverImage[0]?.path);
    updateData.coverImage = coverImageUrl?.url;
  } else if (req.body.coverImage === "") {
    updateData.coverImage = "";
  } else if (req.body.coverImage !== undefined) {
    updateData.coverImage = req.body.coverImage;
  }

  if (
    Object.keys(updateData).length === 0 &&
    (!files || (!files.logo && !files.coverImage))
  ) {
    return next(
      new ErrorHandler("No valid update data or files provided.", 400)
    );
  }

  const updatedDealership = await Dealership.findByIdAndUpdate(
    dealershipId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (!updatedDealership) {
    return next(
      new ErrorHandler(`Dealership not found with ID: ${dealershipId}`, 404)
    );
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Dealership updated successfully",
    data: updatedDealership,
  });
});

module.exports.getDealershipById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const dealership = await Dealership.findById(id);

  if (!dealership) {
    return sendResponse(res, {
      statusCode: 404,
      message: "Dealership not found",
    });
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Dealership fetched successfully",
    data: dealership,
  });
});


module.exports.createDealership = asyncHandler(async (req, res, next) => {
  const {
    name,
    address,
    phone,
    email,
    website,
    services,
    specialties,
    hours,
    mapUrl,
    description,
  } = req.body;

  if (!name || !address || !phone || !email || !services || !hours) {
    return next(
      new ErrorHandler(
        "Please provide all required dealership information: name, address, phone, email, services, and hours.",
        400
      )
    );
  }
  const dealerAvatar = req.files?.logo || "";
  const dealerCoverImage = req.files?.coverImage || "";
  const coverImage = await uploadFile(dealerCoverImage[0]?.path || "");
  const logo = await uploadFile(dealerAvatar[0]?.path || "");
  const servicesArray = services
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);
  const specialtiesArray = specialties
    ? specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s)
    : [];

  const newDealership = new Dealership({
    name,
    logo: logo?.url || "",
    coverImage: coverImage?.url || "",
    address,
    phone,
    email,
    website,
    services: servicesArray,
    specialties: specialtiesArray,
    hours,
    mapUrl,
    description,
  });

  const createdDealership = await newDealership.save();

  sendResponse(res, {
    statusCode: 201,
    message: "Dealership created successfully",
    data: createdDealership,
  });
});

module.exports.deleteDealership = asyncHandler(async (req, res, next) => {
  const { id: dealershipId } = req.params;

  if (!dealershipId) {
    return next(
      new ErrorHandler("Dealership ID is required for deletion", 400)
    );
  }

  const dealershipToDelete = await Dealership.findById(dealershipId);

  if (!dealershipToDelete) {
    return next(
      new ErrorHandler(`Dealership not found with ID: ${dealershipId}`, 404)
    );
  }

  const imagesToDelete = [];
  if (dealershipToDelete.logo) {
    imagesToDelete.push(dealershipToDelete.logo);
  }
  if (dealershipToDelete.coverImage) {
    imagesToDelete.push(dealershipToDelete.coverImage);
  }

  const deletionPromises = imagesToDelete.map(async (imageUrl) => {
    const publicId = getPublicIdFromCloudinaryUrl(imageUrl);
    if (publicId) {
      try {
        const result = await destroyFile(publicId);
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

  await Promise.allSettled(deletionPromises);

  const deletedDealership = await Dealership.findByIdAndDelete(dealershipId);

  if (!deletedDealership) {
    return next(
      new ErrorHandler(`Dealership not found with ID: ${dealershipId}`, 404)
    );
  }

  sendResponse(res, {
    statusCode: 200,
    message: "Dealership and associated images deleted successfully",
    data: null,
  });
});

module.exports.searchDealerships = asyncHandler(async (req, res, next) => {
  const { name } = req.query;

  if (!name || name.trim() === "") {
    return next(new ErrorHandler("Search query 'name' is required.", 400));
  }

  const searchRegex = new RegExp(name.trim(), "i");

  const query = {
    name: { $regex: searchRegex },
  };

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const dealerships = await Dealership.find(query)
    .sort({ name: 1 })
    .skip(skip)
    .limit(limit);

  const totalCount = await Dealership.countDocuments(query);
  const totalPages = Math.ceil(totalCount / limit);

  sendResponse(res, {
    statusCode: 200,
    message: `Found ${totalCount} dealerships matching '${name}'`,
    data: dealerships,
    pagination: {
      currentPage: page,
      limit: limit,
      totalPages: totalPages,
      totalItems: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
    },
  });
});

module.exports.getDealershipNamesAndIds = asyncHandler(
  async (req, res, next) => {
    try {
      const dealerships = await Dealership.find({}, "name").sort({ name: 1 });

      sendResponse(res, {
        statusCode: 200,
        message: "Dealership names and IDs fetched successfully",
        data: dealerships,
      });
    } catch (error) {
      console.error("Error fetching dealership names and IDs:", error);
      return next(
        new ErrorHandler("Failed to fetch dealership names and IDs", 500)
      );
    }
  }
);


module.exports.totalDealer = asyncHandler(async (req, res, next) => {
  const contact = await Dealership.countDocuments({});
  sendResponse(res, {
    statusCode: 200, 
    message: "Contact total",
    data: contact,
  });
});