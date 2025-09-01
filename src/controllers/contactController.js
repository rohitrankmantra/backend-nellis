const asyncHandler = require("../utils/asyncHandler");
const Contact = require("../models/contact");
const ErrorHandler = require("../utils/ErrorHandler");
const sendResponse = require("../utils/sendResponse");

exports.createContact = asyncHandler(async (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;

  // Basic validation to ensure required fields are present
  if (!name || !email || !subject || !message) {
    return next(
      new ErrorHandler(
        "Please provide all required fields: name, email, subject, and message",
        400
      )
    );
  }

  // Create a new contact document in the database
  const newContact = await Contact.create({
    name,
    email,
    phone,
    subject,
    message,
    status: "new", // Explicitly set status to 'new' for newly created inquiries
  });

  // Send a success response
  sendResponse(res, {
    statusCode: 201, // 201 Created
    message: "Contact inquiry submitted successfully",
    data: newContact,
  });
});

exports.getAllContacts = asyncHandler(async (req, res, next) => {
  const contacts = await Contact.find().sort({ createdAt: -1 });

  if (!contacts || contacts.length === 0) {
    return next(new ErrorHandler("No contact inquiries found", 404));
  }

  // Send a success response with the fetched contacts
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact inquiries fetched successfully",
    data: contacts,
    total: contacts.length,
  });
});

exports.getContactById = asyncHandler(async (req, res, next) => {
  // Find a contact by its ID from the request parameters
  const contact = await Contact.findById(req.params.id);

  // If no contact is found with the given ID, return a 404 error
  if (!contact) {
    return next(
      new ErrorHandler(
        `Contact inquiry not found with ID of ${req.params.id}`,
        404
      )
    );
  }

  // Send a success response with the fetched contact
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact inquiry fetched successfully",
    data: contact,
  });
});

exports.updateContact = asyncHandler(async (req, res, next) => {
  const { name, email, phone, subject, message } = req.body;

  // Find the contact by ID and update it. `new: true` returns the updated document.
  // Run validators to ensure updated data still conforms to schema rules.
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { name, email, phone, subject, message },
    { new: true, runValidators: true }
  );

  // If no contact is found with the given ID, return a 404 error
  if (!contact) {
    return next(
      new ErrorHandler(
        `Contact inquiry not found with ID of ${req.params.id}`,
        404
      )
    );
  }

  // Send a success response with the updated contact
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact inquiry updated successfully",
    data: contact,
  });
});

exports.updateContactStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  // Validate that a status is provided in the request body
  if (!status) {
    return next(
      new ErrorHandler("Status field is required for this update", 400)
    );
  }

  // Find the contact by ID
  const contact = await Contact.findById(req.params.id);

  // If no contact is found with the given ID, return a 404 error
  if (!contact) {
    return next(
      new ErrorHandler(
        `Contact inquiry not found with ID of ${req.params.id}`,
        404
      )
    );
  }

  // Validate the provided status against the allowed enum values
  const allowedStatuses = ["new", "responded", "archive"];
  if (!allowedStatuses.includes(status)) {
    return next(
      new ErrorHandler(
        `Invalid status value: "${status}". Allowed values are: ${allowedStatuses.join(
          ", "
        )}`,
        400
      )
    );
  }

  // Update only the status field
  contact.status = status;
  await contact.save(); // Save the updated document

  // Send a success response
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: `Contact inquiry status updated to "${status}"`,
    data: contact,
  });
});

exports.deleteContact = asyncHandler(async (req, res, next) => {
  // Find the contact by ID and delete it
  const contact = await Contact.findByIdAndDelete(req.params.id);

  // If no contact is found with the given ID, return a 404 error
  if (!contact) {
    return next(
      new ErrorHandler(
        `Contact inquiry not found with ID of ${req.params.id}`,
        404
      )
    );
  }

  // Send a success response (no data returned for deletion)
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact inquiry deleted successfully",
    data: null,
  });
});

exports.totalContact = asyncHandler(async (req, res, next) => {
  const contact = await Contact.countDocuments({});
  sendResponse(res, {
    statusCode: 200, // 200 OK
    message: "Contact total",
    data: contact,
  });
});
