const DemandeLocation = require("../models/DemandeLocation");
const boutiqueService = require("../service/ABoutiqueService");
/**
 * ➜ CREATE - Créer une nouvelle demande de location
 */
const createDemande = async (data) => {
  return await DemandeLocation.create(data);
};

/**
 * ➜ GET BY ID - Récupérer une demande par son ID
 */
const getDemandeById = async (id) => {
  return await DemandeLocation.findById(id)
    .populate("boutique.boutique_id", "numero etage prix is_disponible")
    .populate("demandeur.user_id", "nom telephone");
};

/**
 * ➜ GET ALL (avec pagination et filtres optionnels)
 */
const getAllDemandes = async (page = 1, limit = 10, statut = null) => {
  const skip = (page - 1) * limit;

  const filter = {};
  if (statut) filter.statut = statut;

  const [items, total] = await Promise.all([
    DemandeLocation.find(filter)
      .sort({ date_demande: -1 })
      .skip(skip)
      .limit(limit)
      .populate("boutique.boutique_id", "numero etage prix is_disponible")
      .populate("demandeur.user_id", "nom telephone"),

    DemandeLocation.countDocuments(filter),
  ]);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * ➜ GET BY BOUTIQUE - Récupérer les demandes pour une boutique spécifique
 */
const getDemandesByBoutique = async (boutiqueId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    DemandeLocation.find({ "boutique.boutique_id": boutiqueId })
      .sort({ date_demande: -1 })
      .skip(skip)
      .limit(limit)
      .populate("demandeur.user_id", "nom telephone"),

    DemandeLocation.countDocuments({ "boutique.boutique_id": boutiqueId }),
  ]);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * ➜ GET BY DEMANDEUR - Récupérer les demandes d'un utilisateur spécifique
 */
const getDemandesByDemandeur = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    DemandeLocation.find({ "demandeur.user_id": userId })
      .sort({ date_demande: -1 })
      .skip(skip)
      .limit(limit)
      .populate("boutique.boutique_id", "numero etage prix is_disponible"),

    DemandeLocation.countDocuments({ "demandeur.user_id": userId }),
  ]);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * ➜ GET EN ATTENTE - Récupérer toutes les demandes en attente
 */
const getDemandesEnAttente = async (page = 1, limit = 10) => {
  return await getAllDemandes(page, limit, "EN_ATTENTE");
};

/**
 * ➜ UPDATE STATUT - Mettre à jour le statut d'une demande
 */
/**
 * Mettre à jour le statut d'une demande (Admin)
 */
const updateDemandeStatut = async (id, statut, adminId, notes = null) => {
  const demande = await DemandeLocation.findById(id);

  if (!demande) {
    throw new Error("Demande introuvable");
  }

  // Mise à jour de la demande
  demande.statut = statut;
  demande.traitement = {
    date_traitement: new Date(),
    traite_par: adminId,
    notes_admin: notes || null,
  };

  await demande.save();

  // Si la demande est approuvée
  if (statut === "APPROUVEE") {
    const boutiqueId = demande.boutique.boutique_id;
    const locataireId =
      demande.demandeur.user_id._id || demande.demandeur.user_id;

    try {
      // 1. Mettre à jour la boutique avec les informations de la demande
      await boutiqueService.updateBoutiqueFromDemande(
        boutiqueId,
        demande,
        locataireId
      );

      console.log(`✅ Boutique ${boutiqueId} attribuée à ${locataireId}`);

      // 2. Refuser toutes les autres demandes de la boutique
      const autresRefusees = await DemandeLocation.updateMany(
        {
          "boutique.boutique_id": boutiqueId,
          statut: "EN_ATTENTE",
          _id: { $ne: id },
        },
        {
          $set: {
            statut: "REJETEE",
            "traitement.date_traitement": new Date(),
            "traitement.traite_par": adminId,
            "traitement.notes_admin":
              "Automatiquement refusée suite à l'approbation d'une autre demande pour cette boutique",
          },
        }
      );

      console.log(
        `🔄 ${autresRefusees.modifiedCount} autre(s) demande(s) refusée(s) pour la boutique ${boutiqueId}`
      );
    } catch (error) {
      console.error(`❌ Erreur lors de l'approbation:`, error);
      // On ne throw pas l'erreur pour que la demande soit quand même marquée comme approuvée
      // Mais on log l'erreur pour investigation
    }
  }

  return demande;
};

/**
 * ➜ UPDATE - Mettre à jour une demande (utilisation générale)
 */
const updateDemande = async (id, data) => {
  return await DemandeLocation.findByIdAndUpdate(id, data, { new: true });
};

/**
 * ➜ DELETE - Supprimer une demande
 */
const deleteDemande = async (id) => {
  return await DemandeLocation.findByIdAndDelete(id);
};

/**
 * ➜ CHECK EXISTING - Vérifier si UNE DEMANDE EN ATTENTE DE CE DEMANDEUR existe déjà pour cette boutique
 * MODIFICATION ICI : On garde la vérification mais on explique qu'elle est nécessaire
 * pour éviter les doublons d'un même utilisateur, mais plusieurs utilisateurs différents
 * peuvent faire des demandes pour la même boutique
 */
const checkExistingDemandeEnAttente = async (boutiqueId, userId) => {
  return await DemandeLocation.findOne({
    "boutique.boutique_id": boutiqueId,
    "demandeur.user_id": userId,
    statut: "EN_ATTENTE",
  });
};

/**
 * ➜ COUNT BY STATUS - Compter les demandes par statut
 */
const countDemandesByStatus = async () => {
  const stats = await DemandeLocation.aggregate([
    {
      $group: {
        _id: "$statut",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    EN_ATTENTE: 0,
    APPROUVEE: 0,
    REJETEE: 0,
    ANNULEE: 0,
  };

  stats.forEach((stat) => {
    result[stat._id] = stat.count;
  });

  return result;
};

/**
 * ➜ GET STATS - Statistiques générales des demandes
 */
const getDemandesStats = async () => {
  const [total, enAttente, parStatut] = await Promise.all([
    DemandeLocation.countDocuments(),
    DemandeLocation.countDocuments({ statut: "EN_ATTENTE" }),
    countDemandesByStatus(),
  ]);

  return {
    total,
    enAttente,
    ...parStatut,
  };
};

module.exports = {
  createDemande,
  getDemandeById,
  getAllDemandes,
  updateDemande,
  deleteDemande,
  getDemandesByBoutique,
  getDemandesByDemandeur,
  getDemandesEnAttente,
  updateDemandeStatut,
  checkExistingDemandeEnAttente,
  countDemandesByStatus,
  getDemandesStats,
};
