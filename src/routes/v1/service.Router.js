const express = require("express");
const router = express.Router();

const serviceController = require("../../controllers/serviceController.js");

router.get("/", serviceController.getAllServices);
router.get("/totalService",serviceController.totalService)
// router.get("/search", serviceController.searchDealerships);
// router.get("/searchIdName", serviceController.getDealershipNamesAndIds);

router.post("/", serviceController.createService);

router.put("/:id", serviceController.updateService);
router.put("/status/:id",serviceController.updateServiceStatus)
router.delete("/:id", serviceController.deleteService);

module.exports = router;
