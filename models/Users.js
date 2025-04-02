import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firebaseId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Equipo", default: [] }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
