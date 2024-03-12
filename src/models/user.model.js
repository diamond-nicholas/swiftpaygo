const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("./plugins");
const { userRoles, teamRoles } = require("../config/roles");

const userSchema = mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    otp: {
      type: String,
      trim: true,
      private: true,
    },
    otpExpires: {
      type: Date,
      private: true,
    },
    resetOtp: {
      type: String,
      trim: true,
      private: true,
    },
    resetOtpExpires: {
      type: Date,
      private: true,
    },
    mobile: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [10, "Mobile number must be at least 10 characters long"],
      maxlength: [15, "Mobile number cannot exceed 15 characters"],
      match: [/^\+[1-9]\d{1,14}$/, "Please enter a valid mobile number"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number"
          );
        }
      },
      private: true,
    },
    transactionPin: {
      type: String,
      trim: true,
      validate(value) {
        if (!validator.isNumeric(value) || value.length !== 4) {
          throw new Error("The security pin must be a 5-digit number.");
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: userRoles,
      default: "user",
    },
    profile: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "UserProfile",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.statics.isMobileTaken = async function (mobile) {
  const user = await this.findOne({ mobile });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.methods.isTransactionPinMatch = async function (transactionPin) {
  const user = this;
  return bcrypt.compare(transactionPin, user.transactionPin);
};

userSchema.methods.isResetOtpMatch = async function (resetOtp) {
  const user = this;
  return bcrypt.compare(resetOtp, user.resetOtp);
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, parseInt(5, 10));
  }
  if (user.isModified("otp") && user.otp) {
    user.otp = await bcrypt.hash(user.otp, parseInt(5, 10));
  }
  if (user.isModified("transactionPin") && user.transactionPin) {
    user.transactionPin = await bcrypt.hash(
      user.transactionPin,
      parseInt(5, 10)
    );
  }
  if (user.isModified("resetOtp") && user.resetOtp) {
    user.resetOtp = await bcrypt.hash(user.resetOtp, parseInt(5, 10));
  }
  next();
});

userSchema.methods.verifyOTP = async function (enteredOTP) {
  return bcrypt.compare(enteredOTP, this.otp);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
