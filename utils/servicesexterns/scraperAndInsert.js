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
  //{ name: "Premier League", url: "https://www.sofascore.com/tournament/football/england/premier-league/17", country: "England" }
];

// 📌 Función para extraer porcentaje de valores en paréntesis "(86%)"
const extractPercentage = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  const match = value.match(/\((\d+)%\)/);
  return match ? parseFloat(match[1]) / 100 : parseFloat(value) || 0;
};

const insertData = async () => {
  console.log("🚀 Conectando a MongoDB...");
  await mongoose.connect(process.env.MONGO_URI);

  // Lanzar el navegador con protocolo timeout extendido
  const browser = await puppeteer.launch({
    headless: false,
    protocolTimeout: 72000000, // 20 horas
  });

  for (let league of leagues) {
    console.log(`🔄 Insertando datos de ${league.name}...`);
    let teams = await scrapeTeamsFromSofascore(league.url, browser);

    for (let team of teams) {
      let existingTeam = await Team.findOneAndUpdate(
        { name: team.name },
        { name: team.name, league: league.name, country: league.country },
        { upsert: true, new: true }
      );

      let players = await scrapePlayersFromTeam(team.link, browser);

      // Procesamiento secuencial de jugadores para que cada extracción se realice individualmente
      for (const player of players) {
        try {
          let existingPlayer = await Player.findOne({ name: player.name });
          if (!existingPlayer) {
            console.log(`📊 Extrayendo estadísticas de ${player.name}...`);
            let stats = await scrapePlayerStats(player.link, browser);

            let newPlayer = new Player({
              name: player.name,
              team: existingTeam._id,
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
              rating: stats.rating, // Se asigna el rating extraído
            });

            await newPlayer.save();
            console.log(`✅ Jugador insertado: ${player.name}`);
          }
        } catch (error) {
          console.error(`Error procesando el jugador ${player.name}:`, error);
        }
      }
    }
  }

  console.log("🎯 Inserción completada.");
  await browser.close();
  mongoose.connection.close();
};

insertData();
