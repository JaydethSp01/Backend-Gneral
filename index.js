import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import "./models/Equipos.js";
import TeamsRoutes from "../src/routes/Teams.routes.js";
import { setupMatchTrigger } from "./Triggers/matchTrigger.js";

const app = express();

// Habilita CORS para todas las rutas
app.use(cors());

// También es buena idea habilitar el parseo del body JSON
app.use(express.json());

app.use("/api", TeamsRoutes);

const PORT = process.env.PORT || 3000;
const db =
  process.env.MONGODB_URI ||
  "mongodb+srv://jsimarrapolo:8wRVNDMWkC.6GYu@taskcluster.hixyz.mongodb.net/futnexus?retryWrites=true&w=majority";

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Conexión a la base de datos exitosa.");
    app.listen(PORT, () =>
      console.log(`Servidor escuchando en el puerto ${PORT}`)
    );
  })
  .catch((error) =>
    console.error("Error al conectar a la base de datos:", error)
  );
setupMatchTrigger();
