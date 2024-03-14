const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");
const { userRoles, teamRoles } = require("../config/roles");

const userProfileSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      // index: true,
    },
    avatar: {
      type: String,
      default: null,
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
    swiftPayTag: {
      type: String,
      default: null,
    },
    biometricVerification: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const UserProfile = mongoose.model("UserProfile", userProfileSchema);

module.exports = UserProfile;
