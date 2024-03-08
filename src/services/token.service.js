const jwt = require("jsonwebtoken");
const moment = require("moment");
const httpStatus = require("http-status");
const config = require("../config/config");
const userService = require("./user.service");
const { Token } = require("../models");
const ApiError = require("../utils/ApiError");
const { tokenTypes } = require("../config/token");
const User = require("../models/user.model");

const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

const saveToken = async (token, userId, expires, type, blacklisted = false) => {
  const tokenDoc = await Token.create({
    token,
    user: userId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};

const generateAndSaveOTP = async (user) => {
  const otp = generateOTP();
  console.log(otp);
  user.otp = otp;
  user.otpExpires = moment().add(config.jwt.otpExpirationMinutes, "minutes");
  await user.save();
  return otp;
};

const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new Error("Token not found");
  }
  return tokenDoc;
};

const verifyOTP = async (otp) => {
  const user = await User.findOne({ otp });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found or OTP mismatch");
  }

  const isOTPMatch = await user.verifyOTP(otp);

  if (!isOTPMatch) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found or OTP mismatch");
  }

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return user;
};

const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes"
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    tokenTypes.ACCESS
  );

  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    "days"
  );
  const refreshTokenMaxAge = refreshTokenExpires.diff(
    moment().add(5, "minutes")
  );
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );
  await saveToken(accessToken, user.id, accessTokenExpires, tokenTypes.ACCESS);
  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      maxAge: refreshTokenMaxAge,
    },
  };
};

const generateResetPasswordToken = async (email) => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "No users found with this email");
  }
  const expires = moment().add(
    config.jwt.resetPasswordExpirationMinutes,
    "minutes"
  );
  const resetPasswordToken = generateToken(
    user.id,
    expires,
    tokenTypes.RESET_PASSWORD
  );
  await saveToken(
    resetPasswordToken,
    user.id,
    expires,
    tokenTypes.RESET_PASSWORD
  );
  return resetPasswordToken;
};

const generateEmailVerificationToken = async (user) => {
  const expires = moment().add(
    config.jwt.emailVerificationExpirationDays,
    "days"
  );
  const emailVerificationToken = generateToken(
    user.id,
    expires,
    tokenTypes.EMAIL_VERIFICATION
  );
  await saveToken(
    emailVerificationToken,
    user.id,
    expires,
    tokenTypes.EMAIL_VERIFICATION
  );
  return emailVerificationToken;
};

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  generateResetPasswordToken,
  generateEmailVerificationToken,
  generateAndSaveOTP,
  verifyOTP,
};
