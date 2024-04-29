const router = require("express").Router();
const controller = require("../controllers/busController");

router.post("/find-bus", controller.FindBus);
router.get("/get-all-departure-points", controller.GetAllDeparturePoints);
router.get("/get-all-arrival-points", controller.GetAllArrivalPoints);
router.get("/get-threshold-time", controller.GetThresholdTime);
router.get("/get-access", controller.GetBusAccess);
router.post("/verify-voucher", controller.VerifyVoucher)

module.exports = router;
