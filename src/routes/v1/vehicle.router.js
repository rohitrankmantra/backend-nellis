const express = require("express");
const router = express.Router();
const { upload } = require("../../middlewares/multer.middleware.js");

const vehicleController = require("../../controllers/vehicleController.js");

router.get("/", vehicleController.getAllVehicles);
router.get("/totalVehical",vehicleController.totalVehicle)
// router.get("/search", vehicleController.searchDealerships);
// router.get("/searchIdName",vehicleController.getDealershipNamesAndIds)

router.post(
  "/",
  upload.fields([
    {
      name: "images",
      maxCount: 5,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  vehicleController.createVehicle
);

router.put(
  "/:id",
  upload.fields([
    {
      name: "images",
      maxCount: 5,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  vehicleController.updateVehicle
);
router.delete("/:id", vehicleController.deleteVehicle);

module.exports = router;
