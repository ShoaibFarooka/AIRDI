const express = require("express");
const router = require("express").Router();
const controller = require("../controllers/paymentController");

router.post("/stripe-checkout", controller.StripeCheckout);
router.post("/webhooks", controller.StripeHooks);

module.exports = router;
