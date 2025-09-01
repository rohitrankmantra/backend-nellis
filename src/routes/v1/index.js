const express = require("express");
const router = express.Router();
const dealerRouter = require("./dealership.router.js");
const weeklySpclRouter = require("./weeklySpcl.router.js");
const vehicleRouter = require("./vehicle.router.js");
const specialOfferRouter = require("./specialOffer.router.js");
const businessOfferRouter = require("./business.Router.js");
const serviceRouter = require("./service.Router.js");
const partsRouter = require("./parts.Router.js");
const postRoutes = require("./posts.js");
const contactRoutes=require("./contactRoute.js")

router.use("/dealerships", dealerRouter);
router.use("/weekly-specials", weeklySpclRouter);
router.use("/vehicles", vehicleRouter);
router.use("/special-offers", specialOfferRouter);
router.use("/businesses", businessOfferRouter);
router.use("/services", serviceRouter);
router.use("/parts", partsRouter);
router.use("/posts", postRoutes);
router.use("/contact",contactRoutes)
module.exports = router;
