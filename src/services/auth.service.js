const httpStatus = require("http-status");
const tokenService = require("./token.service");
const userService = require("./user.service");
const { Token, User } = require("../models");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/token");
const logger = require("../config/logger");
const bcrypt = require("bcryptjs");

const registerUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const user = await User.create(userBody);
  return user;
};

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email or password");
  }
  return user;
};

const changePassword = async (userBody, accessToken) => {
  const accessTokenDoc = await Token.findOne({
    token: accessToken,
    type: tokenTypes.ACCESS,
  });

  if (!accessTokenDoc) {
    throw new Error("Invalid or expired access token");
  }
  const user = await User.findOne({ _id: accessTokenDoc.user });
  console.log(user);

  if (!user) {
    throw new Error("User not found");
  }

  if (!(await user.isPasswordMatch(userBody.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect password");
  }

  if (userBody.new_password !== userBody.confirm_password) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "New password and confirm password must be the same"
    );
  }
  const salt = await bcrypt.genSalt(8);
  const hashedPassword = await bcrypt.hash(userBody.new_password, salt);

  await userService.updateUserById(user._id, { password: hashedPassword });
};

const emailVerification = async (emailVerificationToken) => {
  const emailVerificationTokenDoc = await tokenService.verifyToken(
    emailVerificationToken,
    tokenTypes.EMAIL_VERIFICATION
  );
  const user = await User.findOne({ _id: emailVerificationTokenDoc.user });
  if (!user) {
    throw new Error("User not found");
  }
  await Token.deleteMany({
    userId: user._id,
    type: tokenTypes.EMAIL_VERIFICATION,
  });
  const updatedUser = await userService.updateUserById(user._id, {
    isEmailVerified: true,
  });

  if (!updatedUser) {
    throw new Error("Failed to update user email verification status");
  }

  return updatedUser;
};

const resetPasswordFromEmailToken = async (resetPasswordToken, newPassword) => {
  const resetPasswordTokenDoc = await tokenService.verifyToken(
    resetPasswordToken,
    tokenTypes.RESET_PASSWORD
  );

  const user = await User.findOne({ _id: resetPasswordTokenDoc.user });

  if (!user) {
    throw new Error("User not found");
  }
  await Token.deleteMany({
    userId: user._id,
    type: tokenTypes.RESET_PASSWORD,
  });
  const salt = await bcrypt.genSalt(8);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  await userService.updateUserById(user._id, { password: hashedPassword });
};

const logoutUser = async (refreshToken) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: tokenTypes.REFRESH,
    blacklisted: false,
  });

  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, "Refresh token not found");
  }

  await refreshTokenDoc.deleteOne();
  logger.info("Successfully logged out");
};

module.exports = {
  registerUser,
  loginUserWithEmailAndPassword,
  changePassword,
  emailVerification,
  resetPasswordFromEmailToken,
  logoutUser,
};
