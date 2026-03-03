const Annonce = require("../models/Annonce");

/**
 * Récupère les statistiques des annonces pour un mois et une année donnés
 * @param {number} mois - Le mois (1-12)
 * @param {number} annee - L'année (ex: 2024)
 */
const getAnnonceStats = async (mois, annee) => {
  try {
    // Validation des paramètres
    if (!mois || !annee || mois < 1 || mois > 12) {
      throw new Error("Mois (1-12) et année valides requis");
    }

    // Calcul des dates de début et fin du mois
    const dateDebut = new Date(annee, mois - 1, 1); // Premier jour du mois
    const dateFin = new Date(annee, mois, 0, 23, 59, 59, 999); // Dernier jour du mois

    // Pipeline d'agrégation pour les statistiques mensuelles
    const statsMensuelles = await Annonce.aggregate([
      {
        $match: {
          created_at: {
            $gte: dateDebut,
            $lte: dateFin,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMois: { $sum: 1 },
          brouillons: {
            $sum: { $cond: [{ $eq: ["$statut", "BROUILLON"] }, 1, 0] },
          },
          publiees: {
            $sum: { $cond: [{ $eq: ["$statut", "PUBLIEE"] }, 1, 0] },
          },
          archivees: {
            $sum: { $cond: [{ $eq: ["$statut", "ARCHIVEE"] }, 1, 0] },
          },
          // Répartition par rôle d'émetteur
          parRoleEmetteur: {
            $push: "$emetteur.role",
          },
          // Répartition par type de cible
          parTypeCible: {
            $push: "$cibles",
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalMois: 1,
          brouillons: 1,
          publiees: 1,
          archivees: 1,
          // Calcul des moyennes et répartitions
          repartitionRoleEmetteur: {
            ADMIN: {
              $size: {
                $filter: {
                  input: "$parRoleEmetteur",
                  as: "role",
                  cond: { $eq: ["$$role", "ADMIN"] },
                },
              },
            },
            BOUTIQUE: {
              $size: {
                $filter: {
                  input: "$parRoleEmetteur",
                  as: "role",
                  cond: { $eq: ["$$role", "BOUTIQUE"] },
                },
              },
            },
            ACHETEUR: {
              $size: {
                $filter: {
                  input: "$parRoleEmetteur",
                  as: "role",
                  cond: { $eq: ["$$role", "ACHETEUR"] },
                },
              },
            },
          },
          repartitionTypeCible: {
            ROLE: {
              $size: {
                $filter: {
                  input: "$parTypeCible",
                  as: "cibles",
                  cond: {
                    $in: ["ROLE", "$$cibles"],
                  },
                },
              },
            },
            BOUTIQUE: {
              $size: {
                $filter: {
                  input: "$parTypeCible",
                  as: "cibles",
                  cond: {
                    $in: ["BOUTIQUE", "$$cibles"],
                  },
                },
              },
            },
            ACHETEUR: {
              $size: {
                $filter: {
                  input: "$parTypeCible",
                  as: "cibles",
                  cond: {
                    $in: ["ACHETEUR", "$$cibles"],
                  },
                },
              },
            },
          },
        },
      },
    ]);

    // Statistiques globales (total général)
    const totalGeneral = await Annonce.countDocuments();

    // Mois le plus actif (sur toutes les années)
    const moisLePlusActif = await Annonce.aggregate([
      {
        $group: {
          _id: {
            mois: { $month: "$created_at" },
            annee: { $year: "$created_at" },
          },
          total: { $sum: 1 },
        },
      },
      {
        $sort: { total: -1 },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          _id: 0,
          mois: "$_id.mois",
          annee: "$_id.annee",
          total: 1,
        },
      },
    ]);

    // Formatage des résultats
    const result = {
      periode: {
        mois,
        annee,
        dateDebut: dateDebut.toISOString().split("T")[0],
        dateFin: dateFin.toISOString().split("T")[0],
      },
      totalGeneral,
      statsMensuelles: statsMensuelles[0] || {
        totalMois: 0,
        brouillons: 0,
        publiees: 0,
        archivees: 0,
        repartitionRoleEmetteur: {
          ADMIN: 0,
          BOUTIQUE: 0,
          ACHETEUR: 0,
        },
        repartitionTypeCible: {
          ROLE: 0,
          BOUTIQUE: 0,
          ACHETEUR: 0,
        },
      },
      moisLePlusActif: moisLePlusActif[0] || null,
    };

    // Ajout de la moyenne mensuelle
    if (result.totalGeneral > 0) {
      // Calcul du nombre de mois depuis la première annonce
      const premiereAnnonce = await Annonce.findOne().sort({ created_at: 1 });
      if (premiereAnnonce) {
        const datePremiere = premiereAnnonce.created_at;
        const maintenant = new Date();
        const nbMois =
          (maintenant.getFullYear() - datePremiere.getFullYear()) * 12 +
          (maintenant.getMonth() - datePremiere.getMonth()) +
          1;

        result.moyenneParMois = Math.round((result.totalGeneral / nbMois) * 100) / 100;
      } else {
        result.moyenneParMois = 0;
      }
    } else {
      result.moyenneParMois = 0;
    }

    return result;
  } catch (error) {
    throw new Error(`Erreur lors du calcul des statistiques: ${error.message}`);
  }
};

/**
 * Récupère les statistiques détaillées sur une période
 * @param {number} moisDebut - Mois de début (1-12)
 * @param {number} anneeDebut - Année de début
 * @param {number} moisFin - Mois de fin (1-12)
 * @param {number} anneeFin - Année de fin
 */
const getStatsPeriode = async (moisDebut, anneeDebut, moisFin, anneeFin) => {
  const dateDebut = new Date(anneeDebut, moisDebut - 1, 1);
  const dateFin = new Date(anneeFin, moisFin, 0, 23, 59, 59, 999);

  const stats = await Annonce.aggregate([
    {
      $match: {
        created_at: {
          $gte: dateDebut,
          $lte: dateFin,
        },
      },
    },
    {
      $group: {
        _id: {
          annee: { $year: "$created_at" },
          mois: { $month: "$created_at" },
        },
        total: { $sum: 1 },
        publiees: {
          $sum: { $cond: [{ $eq: ["$statut", "PUBLIEE"] }, 1, 0] },
        },
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
        total: 1,
        publiees: 1,
      },
    },
  ]);

  return stats;
};

module.exports = {
  getAnnonceStats,
  getStatsPeriode,
};