const Joi = require("joi");
const { objectId, password, tokenRegex } = require("./custom.validation");

const updateUserProfile = {
  headers: Joi.object({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    avatar: Joi.string(),
    dark_mode: Joi.boolean(),
    swiftpay_tag: Joi.string(),
    biometric_verification: Joi.boolean(),
  }),
  params: Joi.object({
    userid: Joi.string().required(),
  }),
};

module.exports = {
  updateUserProfile,
};
