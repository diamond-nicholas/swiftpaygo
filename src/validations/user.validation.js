const Joi = require("joi");
const { objectId, password, tokenRegex } = require("./custom.validation");

const updateUserById = {
  headers: Joi.object({
    token: Joi.string().required(),
  }),
  body: Joi.object().keys({
    fullName: Joi.string(),
    mobile: Joi.string(),
    // password: Joi.string().custom(password),
  }),
  params: Joi.object({
    userid: Joi.string().required(),
  }),
};

module.exports = {
  updateUserById,
};
