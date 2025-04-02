import Users from "../models/Users.js";
import { getStatisticsForUser } from "../SP/getStatisticsForUser.js";

export const getDashboardData = async (userId) => {
  const dashboardData = await getStatisticsForUser(userId);
  return dashboardData;
};

export const createOrGetUser = async (firebaseId, username) => {
  let user = await Users.findOne({ firebaseId });
  if (!user) {
    user = new Users({ firebaseId, username });
    await user.save();
    return { user, created: true };
  }
  return { user, created: false };
};
export const updateUserProfile = async (userId, updateData) => {
  const updatedUser = await Users.findByIdAndUpdate(userId, updateData, {
    new: true,
  });

  if (!updatedUser) {
    throw new Error("Usuario no encontrado");
  }

  if (
    updateData.teamUpdate &&
    updatedUser.teams &&
    updatedUser.teams.length > 0
  ) {
    const equipoId = updatedUser.teams[0];
    await Equipo.findByIdAndUpdate(equipoId, updateData.teamUpdate, {
      new: true,
    });
  }

  return updatedUser;
};

export const getUserByFirebaseId = async (firebaseId) => {
  const user = await Users.findOne({ firebaseId });
  if (!user) {
    throw new Error("Usuario no encontrado");
  }
  return user;
};
