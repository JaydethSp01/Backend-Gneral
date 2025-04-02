// routes/user.js
import express from "express";
import {
  createUser,
  getUserDashboard,
  getUserByFirebase,
  updateUserProfileController,
  partidoHandler,
  getEquipos,
  getUserEquipos,
} from "../controllers/User.controller.js";

import Partido from "../models/Partido.js";
import Equipo from "../models/Equipos.js";
import Statistics from "../models/Statistics.js";
import User from "../models/Users.js";
import Equipos from "../models/Equipos.js";
import Images from "../models/Images.js";

const router = express.Router();

router.post("/create/user", createUser);
router.get("/:id/dashboard", getUserDashboard);
router.get("/firebase/:firebaseId", getUserByFirebase);
router.put("/:id", updateUserProfileController);

router.get("/:userId/teams", getUserEquipos);
router.route("/partidos").get(partidoHandler).post(partidoHandler);
router.get("/equipos", getEquipos);
router.route("/:id/partidos").put(partidoHandler).delete(partidoHandler);
router.put("/:id/cancel", async (req, res) => {
  try {
    const partido = await Partido.findByIdAndUpdate(
      req.params.id,
      { estado: "Cancelado" },
      { new: true }
    );
    res.json(partido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/partidos/:id/stats", async (req, res) => {
  try {
    const partidoId = req.params.id;
    const { equipoId, resultado, estado } = req.body; // Se espera el ID del equipo, el resultado y el estado

    // Validar que se envíen los datos necesarios
    if (!equipoId || !resultado) {
      return res.status(400).json({
        message: "Se deben proporcionar el ID del equipo y el resultado.",
      });
    }

    // Buscar el partido por su ID
    const partido = await Partido.findById(partidoId);

    if (!partido) {
      return res.status(404).json({ message: "Partido no encontrado." });
    }

    // Verificar si el equipo pertenece al partido
    const equipoIndex = partido.resultados.findIndex(
      (r) => r.equipo.toString() === equipoId
    );

    if (equipoIndex === -1) {
      return res.status(400).json({
        message: "El equipo no pertenece a este partido.",
      });
    }

    // Actualizar todos los campos del resultado del equipo correspondiente
    partido.resultados[equipoIndex] = {
      ...partido.resultados[equipoIndex],
      ...resultado,
      equipo: partido.resultados[equipoIndex].equipo, // Asegurarse de mantener el campo `equipo`
    };

    // Actualizar el estado del partido si se proporciona
    if (estado) {
      partido.estado = estado;
    }

    // Guardar los cambios en el partido
    await partido.save();

    res.json({
      message: "Resultado actualizado correctamente.",
      partido,
    });
  } catch (error) {
    console.error("Error al actualizar el resultado del partido:", error);
    res.status(500).json({
      message: "Error al actualizar el resultado del partido.",
      error: error.message,
    });
  }
});
// Obtener información de un usuario por su ID
router.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Buscar el usuario por su ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.json({ id: user._id, name: user.username });
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({ message: "Error al obtener el usuario" });
  }
});

router.post("/teams/create", async (req, res) => {
  try {
    const { name, createdBy } = req.body;
    const team = new Equipo({ name, createdBy });
    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Unirse a un equipo (agrega el ID del equipo al array de teams del usuario)
router.post("/teams/join", async (req, res) => {
  try {
    const { userId, teamId } = req.body;
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Usuario no encontrado" });
    if (!user.teams.includes(teamId)) {
      user.teams.push(teamId);
      await user.save();
    }
    res.json({ message: "Usuario unido al equipo correctamente", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/statistics/clasificacion", async (req, res) => {
  try {
    // 1. Get all teams to ensure we have complete data
    const allTeams = await Equipo.find().lean();
    const teamMap = allTeams.reduce((acc, team) => {
      acc[team._id.toString()] = {
        name: team.name,
        stats: {
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsScored: 0,
          goalsConceded: 0,
          goalDifference: 0,
          points: 0,
        },
      };
      return acc;
    }, {});

    // 2. Get all completed matches (filter out "Cancelado" and "Pendiente")
    const allMatches = await Partido.find({
      estado: { $nin: ["Cancelado", "En curso"] },
    }).lean();

    // 3. Process each match to update team statistics
    allMatches.forEach((match) => {
      if (!match.resultados || match.resultados.length !== 2) return;

      const [team1Result, team2Result] = match.resultados;

      // Get team IDs as strings for consistent comparison
      const team1Id = team1Result.equipo.toString();
      const team2Id = team2Result.equipo.toString();

      // Update goals
      teamMap[team1Id].stats.goalsScored += team1Result.goles;
      teamMap[team1Id].stats.goalsConceded += team2Result.goles;
      teamMap[team2Id].stats.goalsScored += team2Result.goles;
      teamMap[team2Id].stats.goalsConceded += team1Result.goles;

      // Update matches played
      teamMap[team1Id].stats.matchesPlayed += 1;
      teamMap[team2Id].stats.matchesPlayed += 1;

      // Determine match outcome
      if (team1Result.goles > team2Result.goles) {
        // Team 1 won
        teamMap[team1Id].stats.wins += 1;
        teamMap[team1Id].stats.points += 3;
        teamMap[team2Id].stats.losses += 1;
      } else if (team1Result.goles < team2Result.goles) {
        // Team 2 won
        teamMap[team2Id].stats.wins += 1;
        teamMap[team2Id].stats.points += 3;
        teamMap[team1Id].stats.losses += 1;
      } else {
        // Draw
        teamMap[team1Id].stats.draws += 1;
        teamMap[team1Id].stats.points += 1;
        teamMap[team2Id].stats.draws += 1;
        teamMap[team2Id].stats.points += 1;
      }
    });

    // 4. Calculate goal differences and prepare final classification
    const clasificacion = Object.keys(teamMap).map((teamId) => {
      const team = teamMap[teamId];
      return {
        team: team.name,
        matchesPlayed: team.stats.matchesPlayed,
        wins: team.stats.wins,
        draws: team.stats.draws,
        losses: team.stats.losses,
        goalsScored: team.stats.goalsScored,
        goalsConceded: team.stats.goalsConceded,
        goalDifference: team.stats.goalsScored - team.stats.goalsConceded,
        points: team.stats.points,
      };
    });

    // 5. Sort the classification
    clasificacion.sort((a, b) => {
      // Sort by points (descending)
      if (b.points !== a.points) return b.points - a.points;
      // Then by goal difference (descending)
      if (b.goalDifference !== a.goalDifference)
        return b.goalDifference - a.goalDifference;
      // Then by goals scored (descending)
      if (b.goalsScored !== a.goalsScored) return b.goalsScored - a.goalsScored;
      // Finally by team name (ascending) as tiebreaker
      return a.team.localeCompare(b.team);
    });

    res.json(clasificacion);
  } catch (error) {
    console.error("Error generating classification:", error);
    res.status(500).json({
      message: "Error al generar la clasificación",
      error: error.message,
    });
  }
});

router.get("/teams-images", async (req, res) => {
  const teams = await Images.find({}, "name logo");
  res.json(teams);
});

router.get("/players-image", async (req, res) => {
  const teams = await Images.find();
  const players = teams.flatMap((team) =>
    team.players.map((player) => ({
      name: player.name,
      photo: player.photo,
      team: team.name,
    }))
  );
  res.json(players);
});
// Buscar un partido por ID
router.get("/partidos/:id", async (req, res) => {
  try {
    const partidoId = req.params.id;

    // Buscar el partido por su ID
    const partido = await Partido.findById(partidoId)
      .populate("equipos")
      .exec();

    if (!partido) {
      return res.status(404).json({ message: "Partido no encontrado" });
    }

    res.json(partido);
  } catch (error) {
    console.error("Error al buscar el partido:", error);
    res.status(500).json({ message: "Error al buscar el partido" });
  }
});

router.post("/teams/leave", async (req, res) => {
  try {
    const { userId, teamId } = req.body;

    // Buscar al usuario por su ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    // Verificar si el usuario pertenece al equipo
    if (!user.teams.includes(teamId)) {
      return res
        .status(400)
        .json({ message: "El usuario no pertenece a este equipo" });
    }

    // Eliminar el equipo del array `teams` del usuario
    user.teams = user.teams.filter((id) => id.toString() !== teamId);
    await user.save();

    res.json({ message: "Usuario salió del equipo correctamente", user });
  } catch (error) {
    console.error("Error al salir del equipo:", error);
    res
      .status(500)
      .json({ message: "Error al salir del equipo", error: error.message });
  }
});

export default router;
