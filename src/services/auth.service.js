const httpStatus = require("http-status");
const tokenService = require("./token.service");
const userService = require("./user/user.service");
const { Token, User } = require("../models");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/token");
const logger = require("../config/logger");
const bcrypt = require("bcryptjs");
const config = require("../config/config");
const moment = require("moment");

const registerUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  if (await User.isMobileTaken(userBody.mobile)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Mobile number already taken");
  }
  const user = await User.create(userBody);
  return user;
};

const resendOTP = async (accessToken) => {
  const accessTokenDoc = await Token.findOne({
    token: accessToken,
    type: tokenTypes.ACCESS,
  });

  if (!accessTokenDoc) {
    throw new Error("Invalid or expired access token");
  }

  const curr_user = await User.findOne({ _id: accessTokenDoc.user });

  if (!curr_user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const newOTP = Math.floor(10000 + Math.random() * 90000).toString();
  const expire = moment().add(config.jwt.otpExpirationMinutes, "minutes");
  curr_user.otp = newOTP;
  curr_user.otpExpires = expire;
  await curr_user.save();

  const userinfo = {
    otp: newOTP,
    user: curr_user.email,
  };
  return userinfo;
};

// const resendOTP = async (accessToken) => {
//   const accessTokenDoc = await Token.findOne({
//     token: accessToken,
//     type: tokenTypes.ACCESS,
//   });

//   if (!accessTokenDoc) {
//     throw new Error("Invalid or expired access token");
//   }

//   const curr_user = await User.findOne({ _id: accessTokenDoc.user });

//   if (!curr_user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const existingToken = await Token.findOne({
//     type: tokenTypes.OTP,
//     used: false,
//     expires: { $gt: new Date() },
//   });

//   if (!existingToken) {
//     const user = await userService.getUserById(curr_user.id);
//     if (!user) {
//       throw new Error("User not found");
//     }

//     const newOTP = Math.floor(10000 + Math.random() * 90000).toString();
//     const expire = moment().add(config.jwt.otpExpirationMinutes, "minutes");
//     const otpToken = tokenService.generateToken(
//       user.id,
//       expire,
//       tokenTypes.OTP
//     );
//     await tokenService.saveToken(otpToken, user.id, expire, tokenTypes.OTP);
//     user.otp = newOTP;
//     await user.save();
//     const userinfo = {
//       otp: newOTP,
//       user: user.email,
//     };
//     console.log(userinfo);
//     return userinfo;
//   } else {
//     const remainingTime = moment(existingToken.expires).diff(
//       moment(),
//       "seconds"
//     );
//     return { message: "OTP token is still valid", remainingTime };
//   }
// };

// const verifyAuthOTP = async (otp, accessToken) => {
//   const accessTokenDoc = await Token.findOne({
//     token: accessToken,
//     type: tokenTypes.ACCESS,
//   });

//   if (!accessTokenDoc) {
//     throw new Error("Invalid or expired access token");
//   }

//   const curr_user = await User.findOne({ _id: accessTokenDoc.user });
//   console.log(curr_user);

//   if (!curr_user) {
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }

//   const user = await tokenService.verifyOTP(otp);

//   if (user.id !== curr_user.id) {
//     throw new ApiError(
//       httpStatus.UNAUTHORIZED,
//       "Invalid user ID for the provided OTP"
//     );
//   }
//   user.isEmailVerified = true;
//   await user.save();
//   return user;
// };
const verifyAuthOTP = async (otp, accessToken) => {
  const accessTokenDoc = await Token.findOne({
    token: accessToken,
    type: tokenTypes.ACCESS,
  });

  if (!accessTokenDoc) {
    throw new Error("Invalid or expired access token");
  }

  const user = await User.findOne({ _id: accessTokenDoc.user });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (!user.otp || !otp) {
    throw new ApiError(httpStatus.BAD_REQUEST, "OTP is missing");
  }

  const isOTPMatch = await user.verifyOTP(otp);

  if (!isOTPMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Access token mismatch");
  }

  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return user;
};

const setTransactionPin = async (accessToken, userPin) => {
  const accessTokenDoc = await Token.findOne({
    token: accessToken,
    type: tokenTypes.ACCESS,
  });

  if (!accessTokenDoc) {
    throw new Error("Invalid or expired access token");
  }

  const user = await User.findOne({ _id: accessTokenDoc.user });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (userPin.transaction_pin !== userPin.confirm_transaction_pin) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Transaction pin mismatch");
  }
  user.transactionPin = userPin.transaction_pin;
  await user.save();

  return user;
};

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect email");
  }
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect password");
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

const forgetPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Email not found");
  }
  const resetPasswordToken = await tokenService.generateResetPasswordOTP(user);
  console.log(resetPasswordToken);
  return resetPasswordToken;
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
  verifyAuthOTP,
  resendOTP,
  setTransactionPin,
  loginUserWithEmailAndPassword,
  changePassword,
  emailVerification,
  resetPasswordFromEmailToken,
  logoutUser,
  forgetPassword,
};
