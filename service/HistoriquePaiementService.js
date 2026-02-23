const HistoriquePaiement = require("../models/HistoriquePaiement");

/**
 * Crée un nouveau paiement
 */
async function createPaiement(data) {
  const paiement = new HistoriquePaiement(data);
  return await paiement.save();
}

/**
 * Récupère les paiements avec pagination et tri par date_prevue
 * @param {Number} page - numéro de page
 * @param {Number} limit - nombre d'éléments par page
 * @param {Object} filter - filtre optionnel (ex: locataire_id)
 */
async function getPaiements({ page = 1, limit = 10, filter = {} }) {
  const skip = (page - 1) * limit;

  const paiements = await HistoriquePaiement.find(filter)
    .sort({ date_prevue: -1 }) // ordre croissant par date_prevue
    .skip(skip)
    .limit(limit)
    .exec();

  const total = await HistoriquePaiement.countDocuments(filter);

  return {
    data: paiements,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Récupère un paiement par ID
 */
async function getPaiementById(id) {
  return await HistoriquePaiement.findById(id).exec();
}

/**
 * Met à jour un paiement par ID
 */
async function updatePaiement(id, updateData) {
  return await HistoriquePaiement.findByIdAndUpdate(id, updateData, {
    new: true,
  }).exec();
}

/**
 * Supprime un paiement par ID
 */
async function deletePaiement(id) {
  return await HistoriquePaiement.findByIdAndDelete(id).exec();
}

async function getPaiementsByBoutique(boutiqueId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const filter = {
    boutique_id: boutiqueId,
    show_to_user: true,
  };

  const paiements = await HistoriquePaiement.find(filter)
    .sort({ date_prevue: 1 }) // ordre croissant par date_prevue
    .skip(skip)
    .limit(limit)
    .exec();

  const total = await HistoriquePaiement.countDocuments(filter);

  return {
    data: paiements,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

module.exports = {
  createPaiement,
  getPaiements,
  getPaiementById,
  updatePaiement,
  deletePaiement,
  getPaiementsByBoutique,
};
