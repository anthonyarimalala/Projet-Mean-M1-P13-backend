const User = require("../models/User");

class UserService {
  /**
   * Récupère les derniers utilisateurs inscrits
   * @param {number} limit - Nombre d'utilisateurs à récupérer
   * @returns {Promise<Array>} - Liste des derniers inscrits
   */
  async getLatestUsers(limit = 5) {
    try {
      const latestUsers = await User.find({ is_deleted: false })
        .sort({ created_at: -1 }) // Tri du plus récent au plus ancien
        .limit(limit)
        .select("-password -__v") // Exclure le mot de passe et les champs techniques
        .lean(); // Pour de meilleures performances

      return latestUsers;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des derniers inscrits: ${error.message}`
      );
    }
  }

  /**
   * Récupère le nombre d'utilisateurs par rôle
   * @returns {Promise<Object>} - Statistiques des utilisateurs
   */
  async getUserStatsByRole() {
    try {
      // Agrégation pour compter les utilisateurs par rôle
      const stats = await User.aggregate([
        {
          $match: { is_deleted: false }, // Exclure les utilisateurs supprimés
        },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]);

      // Formater les résultats
      const result = {
        ADMIN: 0,
        BOUTIQUE: 0,
        ACHETEUR: 0,
        total: 0,
      };

      stats.forEach((stat) => {
        if (stat._id === "ADMIN") result.ADMIN = stat.count;
        if (stat._id === "BOUTIQUE") result.BOUTIQUE = stat.count;
        if (stat._id === "ACHETEUR") result.ACHETEUR = stat.count;
      });

      result.total = result.ADMIN + result.BOUTIQUE + result.ACHETEUR;

      return result;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des statistiques: ${error.message}`
      );
    }
  }

  /**
   * Récupère le nombre d'utilisateurs par rôle avec plus de détails
   * @returns {Promise<Array>} - Statistiques détaillées
   */
  async getUserStatsDetailed() {
    try {
      const stats = await User.aggregate([
        {
          $match: { is_deleted: false },
        },
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
            active: {
              $sum: { $cond: ["$is_active", 1, 0] },
            },
            inactive: {
              $sum: { $cond: ["$is_active", 0, 1] },
            },
          },
        },
        {
          $project: {
            role: "$_id",
            count: 1,
            active: 1,
            inactive: 1,
            _id: 0,
          },
        },
        {
          $sort: { role: 1 },
        },
      ]);

      return stats;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des statistiques détaillées: ${error.message}`
      );
    }
  }
}

module.exports = new UserService();
