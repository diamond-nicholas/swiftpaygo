const express = require("express");
const router = express.Router();
const validate = require("../../middlewares/validate");
const { authValidation, userValidation } = require("../../validations");
const { userController } = require("../../controllers");

router.put(
  "/edit/:userid",
  validate(userValidation.updateUserById),
  userController.updateUserById
);

module.exports = router;
