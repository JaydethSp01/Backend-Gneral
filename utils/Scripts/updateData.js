const mongoose = require("mongoose");
require("dotenv").config();

const Player = require("../../models/Player");
const { scrapePlayersFromTeam } = require("../servicesexterns/scraper");

const updateData = async () => {
    console.log("🚀 Conectando a MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    const players = await Player.find();

    for (let player of players) {
        console.log(`🔄 Actualizando estadísticas de ${player.name}...`);
        let stats = await scrapePlayersFromTeam(player.team);

        if (stats) {
            player.matches = stats.matches || player.matches;
            player.goals = stats.goals || player.goals;
            player.assists = stats.assists || player.assists;
            player.shots = stats.shots || player.shots;
            player.fouls = stats.fouls || player.fouls;
            await player.save();
            console.log(`✅ Estadísticas actualizadas para ${player.name}`);
        }
    }

    console.log("🎯 Actualización completada.");
    mongoose.connection.close();
};

updateData();
