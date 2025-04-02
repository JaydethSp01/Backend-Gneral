// models/Equipo.js
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  statistics: { type: mongoose.Schema.Types.ObjectId, ref: "Statistics" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Equipo", teamSchema);
