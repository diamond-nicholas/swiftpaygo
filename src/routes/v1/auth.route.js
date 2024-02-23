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
module.exports = router;
