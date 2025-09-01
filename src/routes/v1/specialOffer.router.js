const express = require("express");
const router = express.Router();
const { upload } = require("../../middlewares/multer.middleware.js");

const specialOfferController = require("../../controllers/specialOffer.js");

router.get("/", specialOfferController.getAllSpecialOffers);

router.post(
  "/",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  specialOfferController.createSpecialOffer
);

router.put(
  "/:id",
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    }
  ]),
  specialOfferController.updateSpecialOffer
);
router.delete("/:id", specialOfferController.deleteSpecialOffer);

module.exports = router;
