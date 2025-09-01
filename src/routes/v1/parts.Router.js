const express = require("express");
const router = express.Router();

const partsController = require("../../controllers/partController.js");

router.get("/", partsController.getAllParts);
// router.get("/search", partsController.searchDealerships);
// router.get("/searchIdName", partsController.getDealershipNamesAndIds);

router.post("/", partsController.createPart);

router.put("/:id", partsController.updatePart);
router.put("/status/:id",partsController.updatePartStatus)
router.delete("/:id", partsController.deletePart);

module.exports = router;
