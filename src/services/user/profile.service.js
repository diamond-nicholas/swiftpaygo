const httpStatus = require("http-status");
const { User, Token, UserProfile } = require("../../models");
const ApiError = require("../../utils/ApiError");
const { tokenTypes } = require("../../config/token");
const { authService } = require("../index");

const updateProfile = async (userProfile, updateProfileBody) => {
  Object.assign(userProfile, updateProfileBody);
  await userProfile.save();
  return userProfile;
};

const updateUserProfile = async (accessToken, userBody, userId) => {
  let user = authService.getSelf(accessToken);
  const userProfile = UserProfile.findOne({ user: userId });
};

module.exports = {
  updateUserProfile,
};
