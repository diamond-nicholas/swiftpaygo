const Joi = require("joi");
const { objectId, password, tokenRegex } = require("./custom.validation");

const updateUserById = {
  headers: Joi.object({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    fullName: Joi.string(),
    mobile: Joi.string(),
  }),
  params: Joi.object({
    userid: Joi.string().required(),
  }),
};

const changePassword = {
  headers: Joi.object({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password),
    new_password: Joi.string().required().custom(password),
    confirm_password: Joi.string().required().custom(password),
  }),
};

module.exports = {
  updateUserById,
  changePassword,
};
