import {
  createOrGetUser,
  getDashboardData,
  getUserByFirebaseId,
  updateUserProfile,
} from "../services/User.service.js";
import Partido from "../models/Partido.js";
import Equipo from "../models/Equipos.js";
import User from "../models/Users.js";

export const getUserEquipos = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate("teams", "name").exec();
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    res.json(user.teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEquipos = async (req, res) => {
  try {
    // Obtener todos los equipos con su nombre y creador
    const equipos = await Equipo.find()
      .select("name createdBy createdAt")
      .lean();

    // Contar cuántos usuarios tienen cada equipo en su lista de teams
    const equiposConCantidad = await Promise.all(
      equipos.map(async (equipo) => {
        const cantidadJugadores = await User.countDocuments({
          teams: equipo._id,
        });
        return {
          ...equipo,
          cantidadJugadores,
        };
      })
    );

    res.json(equiposConCantidad);
  } catch (error) {
    console.error("Error al obtener equipos:", error);
    res.status(500).json({ message: error.message });
  }
};
export const createUser = async (req, res) => {
  try {
    const { firebaseId, username } = req.body;
    const result = await createOrGetUser(firebaseId, username);

    if (result.created) {
      res.json({ message: "Usuario creado exitosamente", user: result.user });
    } else {
      res.json({ message: "Usuario ya existe", user: result.user });
    }
  } catch (error) {
    console.error("Error en createUser:", error);
    res.status(500).json({ error: "Error al crear el usuario" });
  }
};

export const getUserByFirebase = async (req, res) => {
  try {
    const { firebaseId } = req.params;

    const user = await getUserByFirebaseId(firebaseId);

    return res.json(user);
  } catch (error) {
    return res.status(404).json({ message: error.message });
  }
};

// Orquestador CRUD para Partidos
export const partidoHandler = async (req, res) => {
  try {
    switch (req.method) {
      case "POST": {
        // Crear nuevo partido
        const partido = new Partido(req.body);
        await partido.save();
        return res.status(201).json(partido);
      }
      case "GET": {
        // Listar partidos; si se pasa ?estado=valor se filtra por estado
        const { estado } = req.query;
        const filter = estado && estado !== "todos" ? { estado } : {};
        const partidos = await Partido.find(filter)
          .populate("equipos", "name")
          .exec();
        return res.json(partidos);
      }
      case "PUT": {
        // Actualizar partido (requiere id en params)
        const { id } = req.params;
        const partido = await Partido.findByIdAndUpdate(id, req.body, {
          new: true,
        });
        if (!partido)
          return res.status(404).json({ message: "Partido no encontrado" });
        return res.json(partido);
      }
      case "DELETE": {
        // Eliminar (o cancelar) partido (requiere id en params)
        const { id } = req.params;
        const partido = await Partido.findByIdAndDelete(id);
        if (!partido)
          return res.status(404).json({ message: "Partido no encontrado" });
        return res.json({ message: "Partido eliminado" });
      }
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUserDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const dashboardData = await getDashboardData(id);
    return res.json(dashboardData);
  } catch (error) {
    console.error("Error en getUserDashboard:", error);
    return res
      .status(500)
      .json({ message: error.message || "Error interno del servidor" });
  }
};

export const updateUserProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updatedUser = await updateUserProfile(id, updateData);
    return res.json({
      message: "Perfil actualizado exitosamente",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
