const httpStatus = require("http-status");
const { User } = require("../models");
const ApiError = require("../utils/ApiError");

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

const updateUserById = async (userId, updateBody) => {
  let user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  user = await updateUser(user, updateBody);
  return user;
};

const updateUser = async (user, updateBody) => {
  if (updateBody.teams) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Cannot update user teams");
  }
  if (
    updateBody.email &&
    (await User.isEmailTaken(updateBody.email, user.id))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  Object.assign(user, updateBody);
  await user.save();
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
};
