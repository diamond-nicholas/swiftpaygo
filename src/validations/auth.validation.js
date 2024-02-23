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
module.exports = {
  register,
};
