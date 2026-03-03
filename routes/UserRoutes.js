const express = require("express");
const router = express.Router();
const userService = require("../service/UserService");

/**
 * @route   GET /api/users/latest
 * @desc    Récupérer les derniers utilisateurs inscrits
 * @query   {number} limit - Nombre d'utilisateurs à récupérer (défaut: 10, max: 50)
 * @access  Public
 */
router.get("/latest", async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const latestUsers = await userService.getLatestUsers(limit);

    res.status(200).json({
      success: true,
      count: latestUsers.length,
      data: latestUsers,
    });
  } catch (error) {
    console.error("Erreur derniers inscrits:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des derniers inscrits",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/stats
 * @desc    Récupérer les statistiques des utilisateurs par rôle
 * @access  Public (pour test, à sécuriser plus tard)
 */
router.get("/stats", async (req, res) => {
  try {
    const stats = await userService.getUserStatsByRole();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Erreur stats utilisateurs:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/stats/detailed
 * @desc    Récupérer les statistiques détaillées des utilisateurs
 * @access  Public (pour test, à sécuriser plus tard)
 */
router.get("/stats/detailed", async (req, res) => {
  try {
    const stats = await userService.getUserStatsDetailed();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Erreur stats détaillées:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques détaillées",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/stats/chart
 * @desc    Récupérer les données formatées pour graphique
 * @access  Public (pour test, à sécuriser plus tard)
 */
router.get("/stats/chart", async (req, res) => {
  try {
    const chartData = await userService.getChartData();

    res.status(200).json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error("Erreur données graphique:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la préparation des données pour graphique",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/users/stats/roles/:role
 * @desc    Récupérer les stats pour un rôle spécifique
 * @access  Public (pour test, à sécuriser plus tard)
 */
router.get("/stats/roles/:role", async (req, res) => {
  try {
    const { role } = req.params;

    // Vérifier si le rôle est valide
    const validRoles = ["ADMIN", "BOUTIQUE", "ACHETEUR"];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({
        success: false,
        message: "Rôle invalide. Utilisez ADMIN, BOUTIQUE ou ACHETEUR",
      });
    }

    const count = await User.countDocuments({
      role: role.toUpperCase(),
      is_deleted: false,
    });

    res.status(200).json({
      success: true,
      data: {
        role: role.toUpperCase(),
        count: count,
      },
    });
  } catch (error) {
    console.error("Erreur stats par rôle:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
});

module.exports = router;
