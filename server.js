require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const uploadRoute = require("./routes/upload");
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
// Connexion à MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch((err) => console.log("Erreur MongoDB: ",err));
// Routes
app.use("/api/upload", uploadRoute);
app.use("/api/annonces", require("./routes/annonceRoutes"));
app.use("/api/articles", require("./routes/articleRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.listen(PORT, () =>
  console.log(`Serveur démarré sur le port
${PORT}`)
);
