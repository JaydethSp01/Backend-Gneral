const { scrapePlayersFromTeam, scrapePlayerStats } = require("./scraper");

const test = async () => {
    let players = await scrapePlayersFromTeam("https://www.sofascore.com/team/football/real-madrid/2829");
    console.log("Jugadores extraídos:", players);

    if (players.length > 0) {
        let stats = await scrapePlayerStats(players[0].link);
        console.log("📊 Estadísticas del jugador:", stats);
    }
};

test();
