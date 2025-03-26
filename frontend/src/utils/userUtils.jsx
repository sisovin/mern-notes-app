/**
 * Gets the display name for a user based on available properties
 * @param {Object} userObj - User object which might have various structures
 * @returns {string} - The best display name available
 */
export const getUserDisplayName = (userObj) => {
  if (!userObj) return "User";

  console.log("getUserDisplayName received:", userObj);

  // Check if we received the state object instead of just the user
  if (userObj.isAuthenticated !== undefined && userObj.user) {
    console.log("Received state object, extracting user");
    userObj = userObj.user;
  }

  // Now continue with the standard checks
  if (userObj.username) {
    console.log("Using username:", userObj.username);
    return userObj.username;
  }

  if (userObj.firstName) {
    const name = userObj.lastName
      ? `${userObj.firstName} ${userObj.lastName}`
      : userObj.firstName;
    console.log("Using firstName/lastName:", name);
    return name;
  }

  // Check for email (strip domain)
  if (userObj.email) {
    const emailName = userObj.email.split("@")[0];
    console.log("Using email name:", emailName);
    return emailName;
  }

  // Role-based fallbacks
  if (typeof userObj.role === "string") {
    console.log("Using role (string):", userObj.role);
    return userObj.role === "admin" ? "Administrator" : userObj.role;
  }

  if (userObj.role && typeof userObj.role === "object") {
    // If role has a name property (populated role)
    if (userObj.role.name) {
      console.log("Using role.name:", userObj.role.name);
      return userObj.role.name === "admin"
        ? "Administrator"
        : userObj.role.name;
    }

    // MongoDB ObjectId reference
    if (userObj.role.$oid) {
      console.log("Found MongoDB ObjectId role");
      return userObj.isAdmin ? "Administrator" : "User";
    }
  }

  // Admin status fallback
  if (userObj.isAdmin === true) {
    console.log("Using isAdmin status");
    return "Administrator";
  }

  console.log("No identifying info found, using default");
  return "User";
};
