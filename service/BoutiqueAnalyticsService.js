const Boutique = require("../models/Boutique");

/**
 * Récupère les statistiques générales des boutiques
 */
const getBoutiqueStats = async () => {
  try {
    // Statistiques générales
    const stats = await Boutique.aggregate([
      {
        $match: {
          is_deleted: false, // Exclure les boutiques supprimées
        },
      },
      {
        $group: {
          _id: null,
          totalBoutiques: { $sum: 1 },
          disponibles: {
            $sum: { $cond: [{ $eq: ["$is_disponible", true] }, 1, 0] },
          },
          nonDisponibles: {
            $sum: { $cond: [{ $eq: ["$is_disponible", false] }, 1, 0] },
          },
          // Statistiques par étage
          parEtage: {
            $push: "$etage",
          },
          // Statistiques des prix
          prixMoyen: { $avg: "$prix" },
          prixMin: { $min: "$prix" },
          prixMax: { $max: "$prix" },
          // Boutiques avec promotion
          avecPromotion: {
            $sum: { $cond: [{ $eq: ["$promotion.active", true] }, 1, 0] },
          },
          // Boutiques louées (avec locataire)
          louees: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$locataire_id", null] },
                    { $ne: ["$locataire_id", ""] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalBoutiques: 1,
          disponibles: 1,
          nonDisponibles: 1,
          tauxOccupation: {
            $multiply: [
              { $divide: ["$nonDisponibles", "$totalBoutiques"] },
              100,
            ],
          },
          prixMoyen: { $round: ["$prixMoyen", 2] },
          prixMin: 1,
          prixMax: 1,
          avecPromotion: 1,
          louees: 1,
          // Répartition par étage (à calculer après)
        },
      },
    ]);

    // Récupérer la répartition par étage séparément
    const repartitionEtage = await Boutique.aggregate([
      {
        $match: { is_deleted: false },
      },
      {
        $group: {
          _id: "$etage",
          count: { $sum: 1 },
          disponibles: {
            $sum: { $cond: [{ $eq: ["$is_disponible", true] }, 1, 0] },
          },
          prixMoyen: { $avg: "$prix" },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          etage: "$_id",
          count: 1,
          disponibles: 1,
          prixMoyen: { $round: ["$prixMoyen", 2] },
        },
      },
    ]);

    // Récupérer les catégories les plus populaires
    const categoriesPopulaires = await Boutique.aggregate([
      {
        $match: {
          is_deleted: false,
          categories: { $exists: true, $ne: [] },
        },
      },
      {
        $unwind: "$categories",
      },
      {
        $group: {
          _id: "$categories",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 0,
          categorie: "$_id",
          count: 1,
        },
      },
    ]);

    // Récupérer les dernières boutiques louées
    const dernieresLocations = await Boutique.find({
      is_deleted: false,
      locataire_id: { $ne: null, $ne: "" },
    })
      .sort({ updated_at: -1 })
      .limit(5)
      .select("nom_boutique etage prix date_prochain_paiement updated_at");

    // Compter les boutiques avec prochain paiement dans le mois
    const maintenant = new Date();
    const dansUnMois = new Date();
    dansUnMois.setMonth(maintenant.getMonth() + 1);

    const paiementsAVenir = await Boutique.countDocuments({
      is_deleted: false,
      date_prochain_paiement: {
        $gte: maintenant,
        $lte: dansUnMois,
      },
    });

    const result = {
      ...(stats[0] || {
        totalBoutiques: 0,
        disponibles: 0,
        nonDisponibles: 0,
        tauxOccupation: 0,
        prixMoyen: 0,
        prixMin: 0,
        prixMax: 0,
        avecPromotion: 0,
        louees: 0,
      }),
      repartitionEtage,
      categoriesPopulaires,
      dernieresLocations,
      paiementsAVenir,
      dateCalcul: new Date(),
    };

    return result;
  } catch (error) {
    throw new Error(
      `Erreur lors du calcul des statistiques des boutiques: ${error.message}`
    );
  }
};

/**
 * Récupère les statistiques d'évolution des locations
 * @param {number} mois - Nombre de mois à analyser
 */
const getEvolutionLocations = async (mois = 12) => {
  try {
    const dateLimite = new Date();
    dateLimite.setMonth(dateLimite.getMonth() - mois);

    const evolution = await Boutique.aggregate([
      {
        $match: {
          is_deleted: false,
          updated_at: { $gte: dateLimite },
          locataire_id: { $ne: null, $ne: "" },
        },
      },
      {
        $group: {
          _id: {
            annee: { $year: "$updated_at" },
            mois: { $month: "$updated_at" },
          },
          nouvellesLocations: { $sum: 1 },
          revenuMoyen: { $avg: "$prix" },
        },
      },
      {
        $sort: {
          "_id.annee": 1,
          "_id.mois": 1,
        },
      },
      {
        $project: {
          _id: 0,
          annee: "$_id.annee",
          mois: "$_id.mois",
          nouvellesLocations: 1,
          revenuMoyen: { $round: ["$revenuMoyen", 2] },
        },
      },
    ]);

    return evolution;
  } catch (error) {
    throw new Error(
      `Erreur lors du calcul de l'évolution des locations: ${error.message}`
    );
  }
};

/**
 * Récupère les statistiques détaillées par étage
 */
const getStatsParEtage = async () => {
  try {
    const stats = await Boutique.aggregate([
      {
        $match: { is_deleted: false },
      },
      {
        $group: {
          _id: "$etage",
          total: { $sum: 1 },
          disponibles: {
            $sum: { $cond: [{ $eq: ["$is_disponible", true] }, 1, 0] },
          },
          louees: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$is_disponible", false] },
                    { $ne: ["$locataire_id", null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          prixMoyen: { $avg: "$prix" },
          revenuPotentiel: { $sum: "$prix" },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          _id: 0,
          etage: "$_id",
          total: 1,
          disponibles: 1,
          louees: 1,
          tauxOccupation: {
            $multiply: [{ $divide: ["$louees", "$total"] }, 100],
          },
          prixMoyen: { $round: ["$prixMoyen", 2] },
          revenuPotentiel: 1,
        },
      },
    ]);

    return stats;
  } catch (error) {
    throw new Error(
      `Erreur lors du calcul des statistiques par étage: ${error.message}`
    );
  }
};

module.exports = {
  getBoutiqueStats,
  getEvolutionLocations,
  getStatsParEtage,
};