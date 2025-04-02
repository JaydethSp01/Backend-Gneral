import mongoose from "mongoose";

const resultadoSchema = new mongoose.Schema({
  equipo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Equipo",
    required: true,
  },
  goles: { type: Number, default: 0 },
  asistencias: { type: Number, default: 0 },
  posesion: { type: Number, default: 0 },
  disparosArco: { type: Number, default: 0 },
  disparosFuera: { type: Number, default: 0 },
  pasesCompletados: { type: Number, default: 0 },
  pasesIntentados: { type: Number, default: 0 },
  faltasCometidas: { type: Number, default: 0 },
  faltasRecibidas: { type: Number, default: 0 },
  tarjetasAmarillas: { type: Number, default: 0 },
  tarjetasRojas: { type: Number, default: 0 },
  tirosEsquina: { type: Number, default: 0 },
  fueraDeJuego: { type: Number, default: 0 },
  paradasArquero: { type: Number, default: 0 },
  duelosGanados: { type: Number, default: 0 },
  duelosPerdidos: { type: Number, default: 0 },
  balonesRecuperados: { type: Number, default: 0 },
  perdidasBalon: { type: Number, default: 0 },
  minutosJugados: { type: Number, default: 0 },
  resultado: {
    type: String,
    enum: ["victoria", "empate", "derrota"],
  },
});

const partidoSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },
  lugar: {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  equipos: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Equipo", required: true },
  ],
  resultados: { type: [resultadoSchema] },
  estado: {
    type: String,
    enum: ["Por jugar", "En curso", "Finalizado", "Cancelado"],
    default: "Por jugar",
  },
  createdAt: { type: Date, default: Date.now },
});

partidoSchema.index({ ubicacion: "2dsphere" });

export default mongoose.model("Partido", partidoSchema);
