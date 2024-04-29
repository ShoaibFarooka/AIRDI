const router = require("express").Router();
const controller = require("../controllers/bookingController");

router.post("/search-ticket", controller.SearchTicket);
router.put("/cancel-ticket", controller.CancelTicket);
router.get("/download-ticket/:bookingId", controller.DownloadTicket);
router.get("/verify-ticket/:bookingId", controller.VerifyTicket);

module.exports = router;
