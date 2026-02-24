const DemandeLocation = require("../models/DemandeLocation");

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
const updateDemandeStatut = async (id, statut, adminId, notes = null) => {
  const updateData = {
    statut,
    "traitement.date_traitement": new Date(),
    "traitement.traite_par": adminId,
  };

  if (notes) {
    updateData["traitement.notes_admin"] = notes;
  }

  return await DemandeLocation.findByIdAndUpdate(id, updateData, { new: true });
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