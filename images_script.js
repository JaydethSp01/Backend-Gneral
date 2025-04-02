import express from "express";
import mongoose from "mongoose";
import { Schema, model } from "mongoose";

// Conexión a MongoDB
mongoose
  .connect(
    "mongodb+srv://jsimarrapolo:8wRVNDMWkC.6GYu@taskcluster.hixyz.mongodb.net/futnexus?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("Conectado a MongoDB");
    seedData();
  })
  .catch((err) => console.error("Error al conectar a MongoDB:", err));

// Definir los esquemas y modelos de Mongoose
const playerSchema = new Schema({
  name: String,
  photo: String,
});

const imagesSchema = new Schema({
  name: String,
  logo: String,
  players: [playerSchema],
});

const Images = model("images_liga", imagesSchema);

// Función para insertar los datos iniciales si la colección está vacía
async function seedData() {
  try {
    const count = await Images.countDocuments();
    console.log(`Documentos en la colección: ${count}`);
    if (count === 0) {
      const teams = [
        {
          name: "Barcelona",
          logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/800px-FC_Barcelona_%28crest%29.svg.png",
          players: [
            {
              name: "Lamine Yamal",
              photo:
                "https://assets.laliga.com/squad/2024/t178/p593109/2048x2225/p593109_t178_2024_1_001_000.png",
            },
            {
              name: "Robert Lewandoski",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250002096.webp",
            },
            {
              name: "pedri",
              photo:
                "https://assets.laliga.com/squad/2024/t178/p490541/2048x2225/p490541_t178_2024_1_001_000.png",
            },
            {
              name: "gavi",
              photo:
                "https://www.fcbarcelona.com/photo-resources/2024/10/13/545795b7-4c63-4347-94ab-5f2a49b1eddd/06-Gavi-M.png?width=670&height=790",
            },
            {
              name: "ter stegen",
              photo:
                "https://assets.laliga.com/squad/2024/t178/p77318/2048x2225/p77318_t178_2024_1_001_000.png",
            },
            {
              name: "Raphinha",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250112880.webp",
            },
            {
              name: "dani olmo",
              photo:
                "https://assets.laliga.com/squad/2024/t178/p179370/2048x2048/p179370_t178_2024_1_002_000.jpg",
            },
            {
              name: "pau cubarsi",
              photo:
                "https://assets.laliga.com/squad/2024/t178/p593110/2048x2225/p593110_t178_2024_1_001_000.png",
            },
          ],
        },
        {
          name: "Real Madrid",
          logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png",
          players: [
            {
              name: "Kylian Mbappé",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250076574.webp",
            },
            {
              name: "Vinícius Júnior",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250121533.webp",
            },
            {
              name: "Jude Bellingham",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250128377.webp",
            },
            {
              name: "Rodrygo",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250132829.webp",
            },
            {
              name: "Luka Modrić",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/74699.webp",
            },
            {
              name: "Federico Valverde",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250101284.webp",
            },
            {
              name: "Thibaut Courtois",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250011668.webp",
            },
            {
              name: "Raúl Asencio del Rosario",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250153617.webp",
            },
          ],
        },
        {
          name: "Atlético de Madrid",
          logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/1068.png",
          players: [
            {
              name: "Julián Álvarez",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250172668.webp",
            },
            {
              name: "Antoine Griezmann",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250019498.webp",
            },
            {
              name: "Jan Oblak",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250012069.webp",
            },
            {
              name: "Giuliano Simeone",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250153634.webp",
            },
            {
              name: "Rodrigo De Paul",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250086037.webp",
            },
            {
              name: "Alexander Sørloth",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250061361.webp",
            },
            {
              name: "Koke",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/1909917.webp",
            },
            {
              name: "Conor Gallagher",
              photo:
                "https://img.uefa.com/imgml/TP/players/1/2025/cutoff/250113103.webp",
            },
          ],
        },
        {
          name: "Athletic de Bilbao",
          logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Club_Athletic_Bilbao_logo.svg/1200px-Club_Athletic_Bilbao_logo.svg.png",
          players: [
            {
              name: "Nico Williams",
              photo:
                "https://assets.laliga.com/squad/2024/t174/p523654/2048x2225/p523654_t174_2024_1_001_000.png",
            },
            {
              name: "Iñaki Williams",
              photo:
                "https://assets.laliga.com/squad/2024/t174/p197334/2048x2225/p197334_t174_2024_1_001_000.png",
            },
            {
              name: "Oihan Sancet",
              photo:
                "https://assets.laliga.com/squad/2024/t174/p439772/2048x2048/p439772_t174_2024_1_002_000.jpg",
            },
            {
              name: "Unai Simón",
              photo:
                "https://assets.laliga.com/squad/2024/t174/p212769/1024x1113/p212769_t174_2024_1_001_000.png",
            },
            {
              name: "Maroan Sannadi",
              photo:
                "https://cdn.athletic-club.eus/imagenes/fotofichas/S/maroan-sannadi-harrouch_S.png",
            },
            {
              name: "Julen Agirrezabala",
              photo:
                "https://assets.laliga.com/squad/2024/t174/p470508/2048x2048/p470508_t174_2024_1_002_000.jpg",
            },
            {
              name: "Álvaro Djaló",
              photo:
                "https://cdn.athletic-club.eus/imagenes/fotofichas/L/alvaro-djalo-dias-fernandes_L.png",
            },
            {
              name: "Gorka Guruzeta",
              photo:
                "https://assets.laliga.com/squad/2024/t174/p220182/2048x2048/p220182_t174_2024_1_002_000.jpg",
            },
          ],
        },
        {
          name: "Villareal",
          logo: "https://as01.epimg.net/img/comunes/fotos/fichas/equipos/large/19.png",
          players: [
            {
              name: "Thierno Barry",
              photo:
                "https://assets.laliga.com/squad/2024/t449/p586309/2048x2048/p586309_t449_2024_1_002_000.jpg",
            },
            {
              name: "Nicolas Pépé",
              photo:
                "https://assets.laliga.com/squad/2024/t449/p195735/2048x2048/p195735_t449_2024_1_002_000.jpg",
            },
            {
              name: "Ayoze Pérez",
              photo:
                "https://assets.laliga.com/squad/2024/t449/p168580/2048x2048/p168580_t449_2024_1_002_000.jpg",
            },
            {
              name: "Álex Baena",
              photo:
                "https://assets.laliga.com/squad/2024/t449/p248501/1024x1113/p248501_t449_2024_1_001_000.png",
            },
            {
              name: "Tajon Buchanan",
              photo:
                "https://assets.laliga.com/squad/2024/t449/p424622/2048x2048/p424622_t449_2024_1_002_000.jpg",
            },
            {
              name: "Willy Kambwala",
              photo:
                "https://assets.laliga.com/squad/2024/t449/p518466/2048x2048/p518466_t449_2024_1_002_000.jpg",
            },
            {
              name: "Gerard Moreno",
              photo:
                "https://assets.laliga.com/squad/2024/t449/p93721/2048x2048/p93721_t449_2024_1_002_000.jpg",
            },
            {
              name: "Pape Gueye",
              photo:
                "https://assets.laliga.com/squad/2024/t449/p422453/2048x2048/p422453_t449_2024_1_002_000.jpg",
            },
          ],
        },
        {
          name: "Betis",
          logo: "https://a.espncdn.com/combiner/i?img=/i/teamlogos/soccer/500/244.png",
          players: [
            {
              name: "Antony dos Santos",
              photo:
                "https://i.namu.wiki/i/SoQJe8Wm8qMYKZ6ZF5xM-c5ObWYxNMCHlkzAY2hkyDf_b8lKQbFaHrJpq_BWqgfBWTjduTQodBFQotBFjXdDAQ.webp",
            },
            {
              name: "Isco",
              photo:
                "https://assets.laliga.com/squad/2024/t185/p80209/2048x2225/p80209_t185_2024_1_001_000.png",
            },
            {
              name: "Jesús Rodríguez Caraballo",
              photo:
                "https://media.futbolfantasy.com/thumb/400x400/v202503271044/uploads/images/jugadores/ficha/14322.png",
            },
            {
              name: "Héctor Bellerín",
              photo:
                "https://assets.laliga.com/squad/2024/t185/p98745/2048x2225/p98745_t185_2024_1_001_000.png",
            },
            {
              name: "Giovani Lo Celso",
              photo:
                "https://assets.laliga.com/squad/2024/t185/p200826/2048x2048/p200826_t185_2024_1_002_000.jpg",
            },
            {
              name: "Johnny Cardoso",
              photo:
                "https://assets.laliga.com/squad/2024/t185/p488662/1024x1113/p488662_t185_2024_1_001_000.png",
            },
            {
              name: "Ez Abde",
              photo:
                "https://assets.laliga.com/squad/2024/t185/p500745/1024x1113/p500745_t185_2024_1_001_000.png",
            },
            {
              name: "Cédric Bakambu",
              photo:
                "https://assets.laliga.com/squad/2024/t185/p83341/2048x2225/p83341_t185_2024_1_001_000.png",
            },
          ],
        },
        {
          name: "Rayo Vallecano",
          logo: "https://www.mahou.es/wp-content/uploads/2023/09/escudo_rayo_lg.png",
          players: [
            {
              name: "Andrei Rațiu",
              photo:
                "https://assets.laliga.com/squad/2024/t184/p466543/2048x2048/p466543_t184_2024_1_002_000.jpg",
            },
            {
              name: "Isi Palazon",
              photo:
                "https://statics-maker.llt-services.com/ray/images/2024/08/19/xlarge/e550ee1c-0d9a-47b3-a744-08cc90e0439d-191.jpg",
            },
            {
              name: "Augusto Batalla",
              photo:
                "https://assets.laliga.com/squad/2024/t184/p173209/2048x2225/p173209_t184_2024_1_001_000.png",
            },
            {
              name: "Pedro Díaz Fanjul",
              photo:
                "https://statics-maker.llt-services.com/ray/images/2024/08/19/xlarge/e2a7fb63-2b2e-48aa-afd7-1b25916ca076-151.jpg",
            },
            {
              name: "Álvaro García",
              photo:
                "https://assets.laliga.com/squad/2024/t184/p165682/2048x2048/p165682_t184_2024_1_002_000.jpg",
            },
            {
              name: "Sergio Camello",
              photo:
                "https://statics-maker.llt-services.com/ray/images/2024/09/23/original/d6316e58-b443-4d57-a76b-6be7e4c5fcdc-300.jpg",
            },
            {
              name: "Raúl de Tomás",
              photo:
                "https://statics-maker.llt-services.com/ray/images/2024/09/23/xlarge/c251f5d9-9a75-45b5-9e08-54b9fb05775c-819.jpg",
            },
            {
              name: "Abdul Mumin",
              photo:
                "https://statics-maker.llt-services.com/ray/images/2024/08/19/xlarge/cf17a406-f73f-4b44-bd26-597e14003df5-392.jpg",
            },
          ],
        },
        {
          name: "Celta de Vigo",
          logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/RC_Celta_de_Vigo_logo.svg/1200px-RC_Celta_de_Vigo_logo.svg.png",
          players: [
            {
              name: "Iago Aspas",
              photo:
                "https://rccelta.es/app/uploads/2020/05/RC_CELTA_24_25__Iago_Aspas_01-removebg-preview-e1724071291969.png",
            },
            {
              name: "Marcos Alonso",
              photo:
                "https://rccelta.es/app/uploads/2024/08/RC_Celta_Marcos_Alonso_18-removebg-preview-e1726150601481.png",
            },
            {
              name: "Borja Iglesias",
              photo:
                "https://rccelta.es/app/uploads/2024/07/RC_CELTA_24_25__Borja_Iglesias_01-removebg-preview-e1724071157848.png",
            },
            {
              name: "Óscar Mingueza",
              photo:
                "https://rccelta.es/app/uploads/2022/08/RC_CELTA_24_25__Mingueza_01-removebg-preview-e1724065935648.png",
            },
            {
              name: "Pablo Durán",
              photo:
                "https://assets.laliga.com/squad/2024/t176/p597355/1024x1113/p597355_t176_2024_1_001_000.png",
            },
            {
              name: "Ilaix Moriba",
              photo:
                "https://rccelta.es/app/uploads/2024/08/RC_CELTA_24_25__Ilaix_01-removebg-preview-e1724068858176.png",
            },
            {
              name: "Fer López",
              photo:
                "https://assets.laliga.com/squad/2024/t176/p643135/2048x2225/p643135_t176_2024_1_001_000.png",
            },
            {
              name: "Vicente Guaita",
              photo:
                "https://rccelta.es/app/uploads/2023/09/RC_CELTA_24_25__Guaita_01-removebg-preview-1-e1724065151256.png",
            },
          ],
        },
      ];

      await Images.insertMany(teams);
      console.log("Datos insertados en la colección");
    } else {
      console.log("La colección ya tiene datos, no se insertarán datos.");
    }
  } catch (error) {
    console.error("Error en seedData:", error);
  }
}
