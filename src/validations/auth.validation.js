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

const loginUserWithEmailAndPassword = {
  body: Joi.object().keys({
    email: Joi.string().required(),
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

const setTransactionPin = {
  headers: Joi.object({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    transaction_pin: Joi.string().required(),
    confirm_transaction_pin: Joi.string().required(),
  }),
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().required(),
  }),
};

const resetPasswordFromEmailToken = {
  headers: Joi.object({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    new_password: Joi.string().required(),
    confirm_new_password: Joi.string().required(),
  }),
};

module.exports = {
  register,
  loginUserWithEmailAndPassword,
  verifyAuthOTP,
  resendOTP,
  setTransactionPin,
  forgotPassword,
  resetPasswordFromEmailToken,
};
