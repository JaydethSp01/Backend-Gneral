import mongoose from "mongoose";

const statisticsSchema = new mongoose.Schema({
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Equipo", required: true },
  matchesPlayed: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  goalsScored: { type: Number, default: 0 },
  goalsConceded: { type: Number, default: 0 },
  assists: { type: Number, default: 0 },
  possessionAverage: { type: Number, default: 0 }, // Posesión promedio
  shotsOnTarget: { type: Number, default: 0 },
  shotsOffTarget: { type: Number, default: 0 },
  passesCompleted: { type: Number, default: 0 },
  passesAttempted: { type: Number, default: 0 },
  foulsCommitted: { type: Number, default: 0 },
  foulsReceived: { type: Number, default: 0 },
  yellowCards: { type: Number, default: 0 },
  redCards: { type: Number, default: 0 },
  corners: { type: Number, default: 0 },
  offsides: { type: Number, default: 0 },
  saves: { type: Number, default: 0 },
  duelsWon: { type: Number, default: 0 },
  duelsLost: { type: Number, default: 0 },
  ballsRecovered: { type: Number, default: 0 },
  ballLosses: { type: Number, default: 0 },
  minutesPlayed: { type: Number, default: 0 },
});

export default mongoose.model("Statistics", statisticsSchema);
