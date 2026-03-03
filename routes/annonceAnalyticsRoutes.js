const express = require("express");
const router = express.Router();
const annonceAnalyticsService = require("../service/AnnonceAnalyticsService");
const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Route pour les statistiques mensuelles (protégée - admin uniquement)
router.get(
  "/stats/:mois/:annee",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const mois = parseInt(req.params.mois, 10);
      const annee = parseInt(req.params.annee, 10);

      const stats = await annonceAnalyticsService.getAnnonceStats(mois, annee);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Route pour les statistiques sur une période
router.post(
  "/stats/periode",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const { moisDebut, anneeDebut, moisFin, anneeFin } = req.body;

      if (!moisDebut || !anneeDebut || !moisFin || !anneeFin) {
        return res.status(400).json({
          message:
            "Paramètres manquants: moisDebut, anneeDebut, moisFin, anneeFin requis",
        });
      }

      const stats = await annonceAnalyticsService.getStatsPeriode(
        moisDebut,
        anneeDebut,
        moisFin,
        anneeFin
      );
      res.json(stats);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Route simplifiée pour le mois en cours
router.get(
  "/stats/current",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const maintenant = new Date();
      const mois = maintenant.getMonth() + 1;
      const annee = maintenant.getFullYear();

      const stats = await annonceAnalyticsService.getAnnonceStats(mois, annee);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

module.exports = router;

// // Récupérer les stats pour janvier 2024
// GET /api/annonces/analytics/stats/1/2024

// // Récupérer les stats pour le mois en cours
// GET /api/annonces/analytics/stats/current

// // Récupérer les stats sur une période
// POST /api/annonces/analytics/stats/periode
// Body: {
//   "moisDebut": 1,
//   "anneeDebut": 2024,
//   "moisFin": 3,
//   "anneeFin": 2024
// }
