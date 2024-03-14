const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");
const { tokenTypes } = require("../config/token");
const {
  authService,
  tokenService,
  emailService,
  userService,
} = require("../services");

const updateUserById = catchAsync(async (req, res) => {
  if (!req.headers.authorization) {
    throw new Error("Token is required");
  }
  const [, token] = req.headers.authorization.split(" ");
  const user = await userService.updateUserById(
    token,
    req.body,
    req.params.userid
  );
  res.status(httpStatus.OK).send({
    user,
    message: "update success",
  });
});

const changePassword = catchAsync(async (req, res) => {
  if (!req.headers.authorization) {
    throw new Error("Token is required");
  }
  const [, token] = req.headers.authorization.split(" ");
  const user = await userService.changePassword(token, req.body);
  res.status(httpStatus.OK).send({
    user: "",
    message: "Password update success",
  });
});

module.exports = {
  updateUserById,
  changePassword,
};
