import Partido from "../models/Partido.js";
import Statistics from "../models/Statistics.js";
import mongoose from "mongoose";

export const setupMatchTrigger = () => {
  const pipeline = [
    {
      $match: {
        operationType: "update",
        "updateDescription.updatedFields.estado": "Finalizado",
      },
    },
  ];

  const changeStream = Partido.watch(pipeline);

  changeStream.on("change", async (change) => {
    const partidoId = change.documentKey._id;
    const partido = await Partido.findById(partidoId).populate("equipos");

    if (!partido) return;

    // Actualizar estadísticas para cada equipo
    for (const equipo of partido.equipos) {
      await updateTeamStatistics(equipo._id, partido);
    }
  });

  console.log("🔔 Escuchando cambios en partidos...");
};

const updateTeamStatistics = async (teamId, partido) => {
  const teamStats = await Statistics.findOne({ team: teamId });
  const resultadoEquipo = partido.resultados.find((r) =>
    r.equipo.equals(teamId)
  );

  if (!teamStats || !resultadoEquipo) return;

  // Actualizar valores
  teamStats.matchesPlayed += 1;
  teamStats.goalsScored += resultadoEquipo.goles || 0;
  teamStats.assists += resultadoEquipo.asistencias || 0;
  teamStats.yellowCards += resultadoEquipo.tarjetasAmarillas || 0;
  teamStats.redCards += resultadoEquipo.tarjetasRojas || 0;
  teamStats.foulsCommitted += resultadoEquipo.faltasCometidas || 0;
  teamStats.foulsReceived += resultadoEquipo.faltasRecibidas || 0;

  // Determinar resultado (victoria/empate/derrota)
  const golesEquipo = resultadoEquipo.goles;
  const golesRival =
    partido.resultados.find((r) => !r.equipo.equals(teamId))?.goles || 0;

  if (golesEquipo > golesRival) teamStats.wins += 1;
  else if (golesEquipo === golesRival) teamStats.draws += 1;
  else teamStats.losses += 1;

  await teamStats.save();
};
