const mongoose = require("mongoose");
const BoutiqueAvis = require("../models/BoutiqueAvis");

const createOrUpdateAvis = async (data) => {
  const { id_boutique, id_user, avis, note } = data;

  // Chercher si un avis existe déjà
  const existingAvis = await BoutiqueAvis.findOne({
    id_boutique,
    id_user,
  });

  if (existingAvis) {
    // Mise à jour de l'avis existant
    existingAvis.avis = avis;
    existingAvis.note = note;
    const updatedAvis = await existingAvis.save();

    return {
      avis: updatedAvis,
      created: false,
      message: "Avis mis à jour avec succès",
    };
  } else {
    // Création d'un nouvel avis
    const newAvis = await BoutiqueAvis.create({
      id_boutique,
      id_user,
      avis,
      note,
    });

    return {
      avis: newAvis,
      created: true,
      message: "Avis créé avec succès",
    };
  }
};

const createAvis = async (data) => {
  return BoutiqueAvis.create(data);
};

const getById = async (id) => {
  return BoutiqueAvis.findById(id)
    .populate("id_user", "nom prenom email")
    .populate("id_boutique", "nom");
};

const getByBoutique = async (id_boutique, page = 1, limit = 10) => {
  const query = { id_boutique };
  const skip = Math.max(page - 1, 0) * limit;

  const [items, total] = await Promise.all([
    BoutiqueAvis.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("id_user", "nom prenom email"),
    BoutiqueAvis.countDocuments(query),
  ]);

  const pages = limit > 0 ? Math.ceil(total / limit) : 0;

  // Calculer la moyenne des notes
  const moyenne = await getMoyenneNote(id_boutique);

  // Transformer les données pour un format plus pratique
  const formattedItems = items.map((avis) => {
    const avisObj = avis.toObject();

    if (avisObj.id_user && typeof avisObj.id_user === "object") {
      avisObj.user = {
        nom: avisObj.id_user.nom,
        prenom: avisObj.id_user.prenom,
        email: avisObj.id_user.email,
      };
      avisObj.id_user = avisObj.id_user._id;
    }

    return avisObj;
  });

  return {
    items: formattedItems,
    page,
    limit,
    total,
    pages,
    moyenne,
  };
};

const getByUser = async (id_user, page = 1, limit = 10) => {
  const query = { id_user };
  const skip = Math.max(page - 1, 0) * limit;

  const [items, total] = await Promise.all([
    BoutiqueAvis.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("id_boutique", "nom"),
    BoutiqueAvis.countDocuments(query),
  ]);

  const pages = limit > 0 ? Math.ceil(total / limit) : 0;

  return { items, page, limit, total, pages };
};

const getByNote = async (note, page = 1, limit = 10) => {
  const query = { note };
  const skip = Math.max(page - 1, 0) * limit;

  const [items, total] = await Promise.all([
    BoutiqueAvis.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("id_user", "nom prenom email")
      .populate("id_boutique", "nom"),
    BoutiqueAvis.countDocuments(query),
  ]);

  const pages = limit > 0 ? Math.ceil(total / limit) : 0;

  return { items, page, limit, total, pages };
};

const getByPeriode = async (dateDebut, dateFin, page = 1, limit = 10) => {
  const query = {
    created_at: {
      $gte: new Date(dateDebut),
      $lte: new Date(dateFin),
    },
  };

  const skip = Math.max(page - 1, 0) * limit;

  const [items, total] = await Promise.all([
    BoutiqueAvis.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .populate("id_user", "nom prenom email")
      .populate("id_boutique", "nom"),
    BoutiqueAvis.countDocuments(query),
  ]);

  const pages = limit > 0 ? Math.ceil(total / limit) : 0;

  return { items, page, limit, total, pages };
};

const getMoyenneNote = async (id_boutique) => {
  try {
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id_boutique)) {
      return {
        moyenne: 0,
        total: 0,
        repartition: { note_1: 0, note_2: 0, note_3: 0, note_4: 0, note_5: 0 },
      };
    }

    const result = await BoutiqueAvis.aggregate([
      { $match: { id_boutique: new mongoose.Types.ObjectId(id_boutique) } },
      {
        $group: {
          _id: null,
          moyenne: { $avg: "$note" },
          total: { $sum: 1 },
          repartition: {
            $push: {
              note: "$note",
              count: 1,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          moyenne: { $round: ["$moyenne", 1] },
          total: 1,
          repartition: {
            $arrayToObject: {
              $map: {
                input: { $range: [1, 6] },
                as: "note",
                in: {
                  k: { $concat: ["note_", { $toString: "$$note" }] },
                  v: {
                    $size: {
                      $filter: {
                        input: "$repartition",
                        cond: { $eq: ["$$this.note", "$$note"] },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ]);

    return result.length > 0
      ? result[0]
      : {
          moyenne: 0,
          total: 0,
          repartition: {
            note_1: 0,
            note_2: 0,
            note_3: 0,
            note_4: 0,
            note_5: 0,
          },
        };
  } catch (error) {
    console.error("Erreur dans getMoyenneNote:", error);
    return {
      moyenne: 0,
      total: 0,
      repartition: { note_1: 0, note_2: 0, note_3: 0, note_4: 0, note_5: 0 },
    };
  }
};

const getStatsBoutique = async (id_boutique) => {
  try {
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id_boutique)) {
      return {
        moyenne: 0,
        total: 0,
        repartition: { note_1: 0, note_2: 0, note_3: 0, note_4: 0, note_5: 0 },
        dernier_avis: null,
      };
    }

    const stats = await BoutiqueAvis.aggregate([
      { $match: { id_boutique: new mongoose.Types.ObjectId(id_boutique) } },
      {
        $group: {
          _id: null,
          moyenne: { $avg: "$note" },
          total: { $sum: 1 },
          note_1: { $sum: { $cond: [{ $eq: ["$note", 1] }, 1, 0] } },
          note_2: { $sum: { $cond: [{ $eq: ["$note", 2] }, 1, 0] } },
          note_3: { $sum: { $cond: [{ $eq: ["$note", 3] }, 1, 0] } },
          note_4: { $sum: { $cond: [{ $eq: ["$note", 4] }, 1, 0] } },
          note_5: { $sum: { $cond: [{ $eq: ["$note", 5] }, 1, 0] } },
          dernier_avis: { $max: "$created_at" },
        },
      },
      {
        $project: {
          _id: 0,
          moyenne: { $round: ["$moyenne", 1] },
          total: 1,
          repartition: {
            note_1: 1,
            note_2: 1,
            note_3: 1,
            note_4: 1,
            note_5: 1,
          },
          dernier_avis: 1,
        },
      },
    ]);

    return stats.length > 0
      ? stats[0]
      : {
          moyenne: 0,
          total: 0,
          repartition: {
            note_1: 0,
            note_2: 0,
            note_3: 0,
            note_4: 0,
            note_5: 0,
          },
          dernier_avis: null,
        };
  } catch (error) {
    console.error("Erreur dans getStatsBoutique:", error);
    return {
      moyenne: 0,
      total: 0,
      repartition: { note_1: 0, note_2: 0, note_3: 0, note_4: 0, note_5: 0 },
      dernier_avis: null,
    };
  }
};

const checkUserAvis = async (id_boutique, id_user) => {
  return BoutiqueAvis.findOne({ id_boutique, id_user });
};

const updateAvis = async (id, data) => {
  return BoutiqueAvis.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).populate("id_user", "nom prenom email");
};

const deleteAvis = async (id) => {
  return BoutiqueAvis.findByIdAndDelete(id);
};

const deleteAvisByBoutique = async (id_boutique) => {
  return BoutiqueAvis.deleteMany({ id_boutique });
};

const deleteAvisByUser = async (id_user) => {
  return BoutiqueAvis.deleteMany({ id_user });
};

module.exports = {
  createOrUpdateAvis,
  createAvis,
  getById,
  getByBoutique,
  getByUser,
  getByNote,
  getByPeriode,
  getMoyenneNote,
  getStatsBoutique,
  checkUserAvis,
  updateAvis,
  deleteAvis,
  deleteAvisByBoutique,
  deleteAvisByUser,
};
