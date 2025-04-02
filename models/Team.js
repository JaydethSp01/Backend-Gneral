const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  league: { type: String, required: true },
  country: { type: String, required: true },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  goles_por_partido: { type: Number, default: 0.0 }, // Promedio de goles por partido
  tarjetas_por_partido: { type: Number, default: 0.0 }, // Promedio de tarjetas por partido
});

module.exports = mongoose.model("Team", TeamSchema);
