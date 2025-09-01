// routes/contactRoutes.js
const express = require('express');
const {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  updateContactStatus,
  deleteContact,
  totalContact
} = require('../../controllers/contactController.js');

const router = express.Router();

// Route for submitting a new contact inquiry (public access)
router.route('/').post(createContact);
router.route('/totalContact').get(totalContact)


router.route('/')
  .get(getAllContacts); // GET all contacts

router.route('/:id')
  .get(getContactById)    // GET a single contact by ID
  .put(updateContact)     // UPDATE a contact by ID (general fields)
  .delete(deleteContact); // DELETE a contact by ID

// Specific route to update only the status of a contact
router.route('/:id/status')
  .patch(updateContactStatus); // PATCH status update

module.exports = router;