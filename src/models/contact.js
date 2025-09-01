const mongoose = require('mongoose');
const validator = require('validator'); // Used for email validation

const contactSchema = new mongoose.Schema(
  {
    // Name of the person submitting the inquiry
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true, 
    },
    // Email address of the person
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true, // Converts email to lowercase before saving
      unique: false, // Not unique as multiple users might contact with the same email
    },
    // Optional phone number
    phone: {
      type: String,
      trim: true,
    
    },
    // Subject of the inquiry (e.g., "General Question", "Technical Issue")
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    // The main message content of the inquiry
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    // Status of the inquiry, allowing for workflow management
    status: {
      type: String,
      enum: ['new', 'responded', 'archive'], // Defines allowed string values
      default: 'new', // Sets the default status for new inquiries
    },
  },
  {
    timestamps: true, 
  }
);

// Export the Contact model
module.exports = mongoose.model('Contact', contactSchema);
