const httpStatus = require("http-status");
const catchAsync = require("../utils/catchAsync");
const ApiError = require("../utils/ApiError");
const logger = require("../config/logger");
const { tokenTypes } = require("../config/token");
const { authService, tokenService, emailService } = require("../services");

const registerUser = catchAsync(async (req, res) => {
  const userbody = { ...req.body };
  const user = await authService.registerUser(userbody);
  const tokens = await tokenService.generateAuthTokens(user);
  const emailVerificationTokenOTP = await tokenService.generateAndSaveOTP(user);
  const message = "Successfully registered";
  try {
    await emailService.sendEmailVerificationOTP(
      req.body.email,
      emailVerificationTokenOTP
    );
  } catch (error) {
    logger.warn(
      "Unable to send verification email. Make sure that the email server is connected"
    );
    console.log(error);
  }

  res
    .cookie("refreshToken", tokens.refresh.token, {
      maxAge: tokens.refresh.maxAge,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .status(httpStatus.CREATED)
    .send({
      user: user,
      token: tokens.access,
      message,
      user,
    });
});

const loginUserWithEmailAndPassword = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  const message = "Successfully signed in";
  res
    .cookie("refreshToken", tokens.refresh.token, {
      maxAge: tokens.refresh.maxAge,
      httpOnly: true,
      sameSite: "none",
      secure: true,
    })
    .send({ user, token: tokens.access, message });
});

const resendOTP = catchAsync(async (req, res) => {
  if (!req.headers.authorization) {
    throw new Error("Token is required");
  }
  const [, token] = req.headers.authorization.split(" ");
  const { otp, user } = await authService.resendOTP(token);
  try {
    await emailService.ResendEmailVerificationOTP(user, otp);
    res.status(httpStatus.OK).send({
      otp: otp,
      message: "Resend OTP successful",
    });
  } catch (error) {
    logger.warn(
      "Unable to send verification email. Make sure that the email server is connected"
    );
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      error: "Unable to send verification email",
    });
  }
});

const verifyAuthOTP = catchAsync(async (req, res) => {
  if (!req.headers.authorization) {
    throw new Error("Token is required");
  }
  const [, token] = req.headers.authorization.split(" ");
  const { otp } = req.body;
  const user = await authService.verifyAuthOTP(otp, token);
  res.status(httpStatus.OK).send({
    user,
    message: "OTP verification successful",
  });
});

const setTransactionPin = catchAsync(async (req, res) => {
  if (!req.headers.authorization) {
    throw new Error("Token is required");
  }
  const [, token] = req.headers.authorization.split(" ");
  const result = await authService.setTransactionPin(token, req.body);

  res.status(httpStatus.OK).send({
    data: result,
    message: "Successfully set transaction pin ",
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetToken = await authService.forgetPassword(req.body.email);
  console.log(resetToken, "okko thsi is token");
  // await emailService.sendResetPasswordEmail(req.body.email, resetToken);
  console.log("password reset sent");
  res
    .status(httpStatus.OK)
    .send({ message: "Password reset token sent to email" });
});

module.exports = {
  registerUser,
  loginUserWithEmailAndPassword,
  verifyAuthOTP,
  resendOTP,
  setTransactionPin,
  forgotPassword,
};

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
//   .eyJzdWIiOiI2NWVhZDI4MzZhMzVkOGMxNmIzMjczOGEiLCJpYXQiOjE3MTAwODIyNDYsImV4cCI6MTcxMDA4Mjg0NiwidHlwZSI6InJlc2V0UGFzc3dvcmQifQ
//   .E1frIAd6EpcaVnkEJgFl4VX64CZRY4XzFC7ZBGW75bI;
