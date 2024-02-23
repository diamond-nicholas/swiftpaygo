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
      // required: true,
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
    // activeTeam: {
    //   type: mongoose.SchemaTypes.ObjectId,
    //   ref: "Team",
    //   required: false,
    // },
    // teams: {
    //   type: [
    //     {
    //       id: {
    //         type: mongoose.SchemaTypes.ObjectId,
    //         ref: "Team",
    //         required: true,
    //       },
    //       name: {
    //         type: String,
    //         required: true,
    //         trim: true,
    //       },
    //       role: {
    //         type: String,
    //         enum: teamRoles,
    //         required: true,
    //       },
    //     },
    //   ],
    //   required: false,
    // },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("otp")) {
    user.otp = await bcrypt.hash(user.otp, 8);
  }
  next();
});

userSchema.methods.verifyOTP = async function (enteredOTP) {
  return bcrypt.compare(enteredOTP, this.otp);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
