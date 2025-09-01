const express = require("express");
const router = express.Router();

const businessController = require("../../controllers/businessController.js");

router.get("/", businessController.getAllBusinesses);
// router.get("/search", businessController.searchDealerships);
// router.get("/searchIdName", businessController.getDealershipNamesAndIds);

router.post(
  "/",
  businessController.createBusiness
);

router.put(
  "/:id",
  businessController.updateBusiness
);
router.delete("/:id", businessController.deleteBusiness);

module.exports = router;
