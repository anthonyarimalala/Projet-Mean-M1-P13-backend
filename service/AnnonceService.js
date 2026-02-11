const Annonce = require("../models/Annonce");

const createAnnonce = async (data) => {
  return Annonce.create(data);
};

const getById = async (id) => {
  return Annonce.findById(id);
};

const getPubliee = async (page = 1, limit = 10) => {
  const now = new Date();
  const query = {
    statut: "PUBLIEE",
  };

  const skip = Math.max(page - 1, 0) * limit;

  const [items, total] = await Promise.all([
    Annonce.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate('emetteur.user_id', 'nom prenom email'), // Ajoutez les champs que vous voulez récupérer
    Annonce.countDocuments(query),
  ]);

  const pages = limit > 0 ? Math.ceil(total / limit) : 0;

  // Transformer les données pour un format plus pratique
  const formattedItems = items.map(annonce => {
    const annonceObj = annonce.toObject();
    
    // Si l'utilisateur est peuplé, ajouter ses informations
    if (annonceObj.emetteur && annonceObj.emetteur.user_id) {
      annonceObj.emetteur.user = {
        nom: annonceObj.emetteur.user_id.nom,
        prenom: annonceObj.emetteur.user_id.prenom,
        email: annonceObj.emetteur.user_id.email
      };
      // Garder l'ID original ou le remplacer
      annonceObj.emetteur.user_id = annonceObj.emetteur.user_id._id;
    }
    
    return annonceObj;
  });

  return { items: formattedItems, page, limit, total, pages };
};

const getByCible = async (cibles, page = 1, limit = 10) => {
  if (!Array.isArray(cibles) || cibles.length === 0) {
    return { items: [], page, limit, total: 0, pages: 0 };
  }

  const orConditions = cibles
    .filter((cible) => cible && cible.type && cible.value)
    .map((cible) => ({
      cibles: { $elemMatch: { type: cible.type, value: cible.value } },
    }));

  if (orConditions.length === 0) {
    return { items: [], page, limit, total: 0, pages: 0 };
  }

  const query = { $or: orConditions };
  const skip = Math.max(page - 1, 0) * limit;

  const [items, total] = await Promise.all([
    Annonce.find(query).sort({ date_debut: -1 }).skip(skip).limit(limit),
    Annonce.countDocuments(query),
  ]);

  const pages = limit > 0 ? Math.ceil(total / limit) : 0;

  return { items, page, limit, total, pages };
};

const updateAnnonce = async (id, data) => {
  return Annonce.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const deleteAnnonce = async (id) => {
  return Annonce.findByIdAndDelete(id);
};

module.exports = {
  createAnnonce,
  getById,
  getPubliee,
  getByCible,
  updateAnnonce,
  deleteAnnonce,
};
