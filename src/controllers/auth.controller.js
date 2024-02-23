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

module.exports = { registerUser };
