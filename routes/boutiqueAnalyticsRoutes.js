const express = require("express");
const router = express.Router();
const boutiqueAnalyticsService = require("../service/BoutiqueAnalyticsService");
const auth = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Route pour les statistiques générales des boutiques
router.get(
  "/stats",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const stats = await boutiqueAnalyticsService.getBoutiqueStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Route pour l'évolution des locations (sans paramètre optionnel)
router.get(
  "/evolution",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      // Utiliser le paramètre de query string à la place
      const mois = parseInt(req.query.mois) || 12;
      const evolution = await boutiqueAnalyticsService.getEvolutionLocations(mois);
      res.json({
        success: true,
        data: evolution,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Route alternative avec paramètre dans l'URL (version fixe)
router.get(
  "/evolution/:mois",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const mois = parseInt(req.params.mois) || 12;
      const evolution = await boutiqueAnalyticsService.getEvolutionLocations(mois);
      res.json({
        success: true,
        data: evolution,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Route pour les statistiques par étage
router.get(
  "/stats/etages",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const stats = await boutiqueAnalyticsService.getStatsParEtage();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Route simplifiée pour le tableau de bord (résumé)
router.get(
  "/dashboard",
  auth,
  roleMiddleware("ADMIN"),
  async (req, res) => {
    try {
      const [statsGenerales, evolution, statsEtages] = await Promise.all([
        boutiqueAnalyticsService.getBoutiqueStats(),
        boutiqueAnalyticsService.getEvolutionLocations(6),
        boutiqueAnalyticsService.getStatsParEtage(),
      ]);

      res.json({
        success: true,
        data: {
          resume: {
            totalBoutiques: statsGenerales.totalBoutiques,
            disponibles: statsGenerales.disponibles,
            nonDisponibles: statsGenerales.nonDisponibles,
            tauxOccupation: statsGenerales.tauxOccupation,
            prixMoyen: statsGenerales.prixMoyen,
            avecPromotion: statsGenerales.avecPromotion,
            paiementsAVenir: statsGenerales.paiementsAVenir,
          },
          repartitionEtage: statsEtages,
          evolutionLocations: evolution,
          categoriesPopulaires: statsGenerales.categoriesPopulaires,
          dernieresLocations: statsGenerales.dernieresLocations,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;