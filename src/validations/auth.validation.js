const Joi = require("joi");
const { objectId, password, tokenRegex } = require("./custom.validation");

const register = {
  body: Joi.object().keys({
    fullName: Joi.string().required(),
    email: Joi.string().required(),
    mobile: Joi.string().required(),
    password: Joi.string().required().custom(password),
  }),
};

const verifyAuthOTP = {
  headers: Joi.object({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    otp: Joi.string().required(),
  }),
};

const resendOTP = {
  headers: Joi.object({
    token: Joi.string().required(),
  }),
};

module.exports = {
  register,
  verifyAuthOTP,
  resendOTP,
};
