const express = require("express");
const router = express.Router();
const { upload } = require("../../middlewares/multer.middleware.js");
const weeklyController = require("../../controllers/weeklySpcl.controller.js");

router.get("/", weeklyController.getAllWeeklySpecials);
router.get("/totalWeekly",weeklyController.totalWeekly)
router.post(
  "/",
  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),
  weeklyController.createWeeklySpecial
);
router.put("/:id",  upload.fields([
    {
      name: "thumbnail",
      maxCount: 1,
    },
    {
      name: "video",
      maxCount: 1,
    },
  ]),weeklyController.updateWeeklySpecial);
router.delete("/:id", weeklyController.deleteWeeklySpecial);
module.exports = router;
