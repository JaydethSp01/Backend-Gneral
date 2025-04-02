const mongoose = require("mongoose");

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
  position: { type: String, required: true },
  matches: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 },
  goals: { type: Number, default: 0 },
  expectedGoals: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  expectedAssists: { type: Number, default: 0 },
  shots: { type: Number, default: 0 },
  shotsOnTarget: { type: Number, default: 0 },
  passAccuracy: { type: Number, default: 0 },
  dribbles: { type: Number, default: 0 },
  fouls: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },

  // 📌 Nuevos campos
  shotsLastMatches: [{ type: Number }], // Tiros al arco en los últimos partidos
  foulsLastMatches: [{ type: Number }], // Faltas en los últimos partidos
  yellowCardsLastMatches: [{ type: Number }], // Tarjetas amarillas recientes
});

module.exports = mongoose.model("Player", PlayerSchema);
