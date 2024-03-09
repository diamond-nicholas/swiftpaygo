const express = require("express");
const router = express.Router();
const validate = require("../../middlewares/validate");
const { authValidation } = require("../../validations");
const { authController } = require("../../controllers");

router.post(
  "/register",
  validate(authValidation.register),
  authController.registerUser
);

router.post(
  "/resend-otp",
  validate(authController.resendOTP),
  authController.resendOTP
);

router.post(
  "/verify-otp",
  validate(authValidation.verifyAuthOTP),
  authController.verifyAuthOTP
);

router.post(
  "/transaction-pin",
  validate(authValidation.setTransactionPin),
  authController.setTransactionPin
);

module.exports = router;
