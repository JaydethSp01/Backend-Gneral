import Partido from "../models/Partido.js";
import Users from "../models/Users.js";
import Statistics from "../models/Statistics.js";
export const getStatisticsForUser = async (userId) => {
  const user = await Users.findById(userId).populate("teams");
  if (!user) throw new Error("Usuario no encontrado");

  const userTeamIds = user.teams.map((team) => team._id);

  // 📌 Buscar manualmente las estadísticas de los equipos del usuario
  const statisticsList = await Statistics.find({ team: { $in: userTeamIds } });

  let totalMatches = 0,
    wins = 0,
    draws = 0,
    losses = 0;
  let goals = 0,
    assists = 0,
    yellowCards = 0,
    redCards = 0;
  let foulsCommitted = 0,
    foulsReceived = 0,
    minutesPlayed = 0;

  statisticsList.forEach((stats) => {
    totalMatches += stats.matchesPlayed || 0;
    wins += stats.wins || 0;
    draws += stats.draws || 0;
    losses += stats.losses || 0;
    goals += stats.goalsScored || 0;
    assists += stats.assists || 0;
    yellowCards += stats.yellowCards || 0;
    redCards += stats.redCards || 0;
    foulsCommitted += stats.foulsCommitted || 0;
    foulsReceived += stats.foulsReceived || 0;
    minutesPlayed += stats.minutesPlayed || 0;
  });

  const today = new Date();

  // 📌 Buscar los próximos partidos
  const upcomingMatchesDocs = await Partido.find({
    equipos: { $in: userTeamIds },
    fecha: { $gte: today },
    estado: "Por jugar",
  })
    .populate("equipos", "name")
    .sort({ fecha: 1 })
    .exec();

  const proximosPartidos = upcomingMatchesDocs.map((match) => {
    const fechaDate = new Date(match.fecha);
    const fecha = fechaDate.toLocaleDateString();
    const hora = fechaDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    let equipoA = match.equipos?.[0]?.name || "Por definir";
    let equipoB = match.equipos?.[1]?.name || "Por definir";

    return {
      fecha,
      hora,
      equipoA,
      equipoB,
      lugar: match.lugar,
      estado: match.estado,
      resultado: match.resultado || "N/A",
      goles: match.goles,
      asistencias: match.asistencias,
      id: match._id,
    };
  });

  // 📌 Buscar el historial de partidos (últimos 5 partidos finalizados)
  const recentMatchesDocs = await Partido.find({
    equipos: { $in: userTeamIds },
    fecha: { $lt: today },
    estado: "Finalizado", // Solo partidos finalizados
  })
    .populate("equipos", "name")
    .sort({ fecha: -1 })
    .limit(5)
    .exec();

  const historialPartidos = recentMatchesDocs.map((match) => {
    const fechaDate = new Date(match.fecha);
    const equipoA = match.equipos?.[0]?.name || "Por definir";
    const equipoB = match.equipos?.[1]?.name || "Por definir";

    // Buscar los resultados de los equipos
    const resultadoEquipoA =
      match.resultados.find(
        (r) => r.equipo.toString() === match.equipos[0]._id.toString()
      ) || {};
    const resultadoEquipoB =
      match.resultados.find(
        (r) => r.equipo.toString() === match.equipos[1]._id.toString()
      ) || {};

    return {
      fecha: fechaDate.toLocaleDateString(),
      equipoA,
      equipoB,
      resultado: `${resultadoEquipoA.goles || 0} - ${
        resultadoEquipoB.goles || 0
      }`,
      golesEquipoA: resultadoEquipoA.goles || 0,
      golesEquipoB: resultadoEquipoB.goles || 0,
      asistenciasEquipoA: resultadoEquipoA.asistencias || 0,
      asistenciasEquipoB: resultadoEquipoB.asistencias || 0,
    };
  });
  return {
    partidosJugados: totalMatches,
    victorias: wins,
    empates: draws,
    derrotas: losses,
    golesMarcados: goals,
    asistencias: assists,
    tarjetasAmarillas: yellowCards,
    tarjetasRojas: redCards,
    faltasCometidas: foulsCommitted,
    faltasRecibidas: foulsReceived,
    minutosJugados: minutesPlayed,
    proximosPartidos,
    historialPartidos,
    mejoresCuotas: [],
  };
};
