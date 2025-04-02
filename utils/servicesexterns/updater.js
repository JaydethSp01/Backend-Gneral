const puppeteer = require("puppeteer");
const mongoose = require("mongoose");
require("dotenv").config();

const Team = require("../../models/Team");
const Player = require("../../models/Player");
const {
  scrapeTeamsFromSofascore,
  scrapePlayersFromTeam,
  scrapePlayerStats,
} = require("./scraper");

const leagues = [
  {
    name: "LaLiga",
    url: "https://www.sofascore.com/tournament/football/spain/laliga/8",
    country: "Spain",
  },
];

const extractPercentage = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const match = value.match(/\((\d+)%\)/);
  return match ? parseFloat(match[1]) / 100 : parseFloat(value) || 0;
};

const updateData = async () => {
  console.log("🚀 Iniciando actualización...");

  // Verificar que MONGO_URI esté definida
  if (!process.env.MONGO_URI) {
    console.error("❌ Error: MONGO_URI no está definida en el archivo .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const browser = await puppeteer.launch({
    headless: "new",
    protocolTimeout: 72000000,
  });

  try {
    for (const league of leagues) {
      console.log(`🔄 Actualizando ${league.name}`);
      const teams = await scrapeTeamsFromSofascore(league.url, browser);

      for (const team of teams) {
        console.log(`🔍 Procesando equipo: ${team.name}`);
        const existingTeam = await Team.findOneAndUpdate(
          { name: team.name },
          { league: league.name, country: league.country },
          { new: true }
        );

        if (!existingTeam) {
          console.log(`⚠️ Equipo no encontrado: ${team.name}`);
          continue; // Saltar al siguiente equipo
        }

        const players = await scrapePlayersFromTeam(team.link, browser);

        for (const player of players) {
          try {
            const existingPlayer = await Player.findOne({ name: player.name });

            if (existingPlayer) {
              console.log(`🔄 Actualizando ${player.name}`);
              const stats = await scrapePlayerStats(player.link, browser);

              const updateFields = {
                position: stats.position,
                matches: parseInt(stats.matches) || 0,
                minutesPlayed: parseInt(stats.minutesPlayed) || 0,
                goals: parseInt(stats.goals) || 0,
                expectedGoals: parseFloat(stats.expectedGoals) || 0,
                assists: parseInt(stats.assists) || 0,
                expectedAssists: parseFloat(stats.expectedAssists) || 0,
                shots: parseFloat(stats.shots) || 0,
                shotsOnTarget: parseFloat(stats.shotsOnTarget) || 0,
                passAccuracy: extractPercentage(stats.passAccuracy),
                dribbles: extractPercentage(stats.dribbles),
                fouls: parseFloat(stats.fouls) || 0,
                yellowCards: parseInt(stats.yellowCards) || 0,
                redCards: parseInt(stats.redCards) || 0,
                rating: stats.rating,
                lastUpdated: new Date(),
              };

              await Player.findByIdAndUpdate(
                existingPlayer._id,
                { $set: updateFields },
                { new: true }
              );

              console.log(`✅ ${player.name} actualizado`);
            } else {
              console.log(`⚠️ Jugador nuevo detectado: ${player.name}`);
              // Opcional: Insertar nuevo jugador
            }
          } catch (error) {
            console.error(`Error actualizando ${player.name}:`, error);
          }
        }
      }
    }

    console.log("🎯 Actualización completada");
  } catch (error) {
    console.error("Error durante la actualización:", error);
  } finally {
    await browser.close();
    mongoose.connection.close();
  }
};

// Ejecutar la actualización al correr el script
updateData();
