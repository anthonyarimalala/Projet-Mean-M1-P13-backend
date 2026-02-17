const AnnonceCommentaire = require("../models/AnnonceCommentaire");

/**
 * ➜ CREATE
 */
const createCommentaire = async (data) => {
  return await AnnonceCommentaire.create(data);
};

/**
 * ➜ GET BY ID
 */
const getCommentaireById = async (id) => {
  return await AnnonceCommentaire.findById(id);
};

/**
 * ➜ GET ALL BY ANNONCE (avec pagination)
 */
const getCommentairesByAnnonce = async (
  annonceId,
  page = 1,
  limit = 10
) => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    AnnonceCommentaire.find({ annonce_id: annonceId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),

    AnnonceCommentaire.countDocuments({ annonce_id: annonceId }),
  ]);

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * ➜ UPDATE
 */
const updateCommentaire = async (id, data) => {
  return await AnnonceCommentaire.findByIdAndUpdate(
    id,
    data,
    { new: true }
  );
};

/**
 * ➜ DELETE
 */
const deleteCommentaire = async (id) => {
  return await AnnonceCommentaire.findByIdAndDelete(id);
};

module.exports = {
  createCommentaire,
  getCommentaireById,
  getCommentairesByAnnonce,
  updateCommentaire,
  deleteCommentaire,
};
