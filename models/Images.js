import mongoose from "mongoose";

const { Schema, model } = mongoose; // Importar `Schema` y `model`

const playerSchema = new Schema({
  name: String,
  photo: String,
});

const imagesSchema = new Schema({
  name: String,
  logo: String,
  players: [playerSchema],
});

export default model("images_liga", imagesSchema);
