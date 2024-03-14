const httpStatus = require("http-status");
const { User, Token } = require("../../models");
const ApiError = require("../../utils/ApiError");
const { tokenTypes } = require("../../config/token");

const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const user = await User.create(userBody);
  return user;
};

const queryUsers = async (filter, options) => {
  const users = await User.paginate(filter, options);
  return users;
};

const getUserById = async (id) => {
  return User.findById(id);
};

const getUserByEmail = async (email) => {
  return User.findOne({ email });
};

const updateUser = async (user, updateBody) => {
  if (
    updateBody.email &&
    (await User.isEmailTaken(updateBody.email, user.id))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  if (await User.isMobileTaken(updateBody.mobile)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Mobile number already taken");
  }
  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const updateUserById = async (accessToken, updateBody, userid) => {
  const accessTokenDoc = await Token.findOne({
    token: accessToken,
    type: tokenTypes.ACCESS,
  });
  if (!accessTokenDoc) {
    throw new Error("Invalid or expired access token");
  }
  let user = await User.findOne({ _id: accessTokenDoc.user });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (userid.toString() !== user._id.toString()) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Incorrect userid");
  }

  user = await updateUser(user, updateBody);
  return user;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.remove();
  return user;
};

const addTeam = async (user, team) => {
  user.teams.push({ _id: team.id, ...team });
  await user.save();
  return user;
};

const updateTeamById = async (userId, team) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  const m_team = user.teams.id(team.id);
  if (!m_team) {
    throw new ApiError(httpStatus.NOT_FOUND, "Team not found");
  }
  m_team.name = team.name;
  m_team.role = team.users.id(userId).role;
  await user.save();
  return user;
};

const deleteTeamById = async (userId, teamId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  user.teams.pull(teamId);
  if (user.activeTeam && user.activeTeam.toString() === teamId) {
    user.activeTeam = null;
  }
  await user.save();
  return user;
};
const changePassword = async (accessToken, userBody) => {
  const accessTokenDoc = await Token.findOne({
    token: accessToken,
    type: tokenTypes.ACCESS,
  });

  if (!accessTokenDoc) {
    throw new Error("Invalid or expired access token");
  }
  const user = await User.findOne({ _id: accessTokenDoc.user });

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

  await updateUserById(
    accessToken,
    {
      password: userBody.new_password,
    },
    user._id
  );
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  updateUser,
  deleteUserById,
  addTeam,
  updateTeamById,
  deleteTeamById,
  changePassword,
};
