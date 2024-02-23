const allUserRights = ["getUsers", "manageUsers"];
const userRoleRights = {
  user: [],
  admin: ["getUsers", "manageUsers"],
};

const userRoles = Object.keys(userRoleRights);

module.exports = {
  allUserRights,
  userRoles,
  userRoleRights,
};
