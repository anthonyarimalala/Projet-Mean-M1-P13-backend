const mongoose = require("mongoose");

const boutiqueAvisSchema = new mongoose.Schema(
  {
    id_boutique: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Boutique",
      required: [true, "L'ID de la boutique est requis"],
    },
    id_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "L'ID de l'utilisateur est requis"],
    },
    avis: {
      type: String,
      required: [true, "L'avis est requis"],
      trim: true,
      minlength: [3, "L'avis doit contenir au moins 3 caractères"],
      maxlength: [500, "L'avis ne peut pas dépasser 500 caractères"],
    },
    note: {
      type: Number,
      required: [true, "La note est requise"],
      min: [1, "La note minimale est 1"],
      max: [5, "La note maximale est 5"],
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Index pour optimiser les recherches
boutiqueAvisSchema.index({ id_boutique: 1, created_at: -1 });
boutiqueAvisSchema.index({ id_user: 1, id_boutique: 1 });

// Middleware simplifié avec throw
boutiqueAvisSchema.pre("save", async function () {
  if (this.isNew) {
    const existingReview = await this.constructor.findOne({
      id_boutique: this.id_boutique,
      id_user: this.id_user,
    });

    if (existingReview) {
      throw new Error("Vous avez déjà donné un avis pour cette boutique");
    }
  }
});

// Méthode statique pour calculer la moyenne des notes d'une boutique
boutiqueAvisSchema.statics.getAverageNote = async function (id_boutique) {
  try {
    // Vérifier si l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id_boutique)) {
      return { average: 0, count: 0 };
    }

    const result = await this.aggregate([
      { $match: { id_boutique: new mongoose.Types.ObjectId(id_boutique) } },
      {
        $group: {
          _id: null,
          average: { $avg: "$note" },
          count: { $sum: 1 },
        },
      },
    ]);

    return result.length > 0
      ? {
          average: Math.round(result[0].average * 10) / 10,
          count: result[0].count,
        }
      : { average: 0, count: 0 };
  } catch (error) {
    console.error("Erreur dans getAverageNote:", error);
    return { average: 0, count: 0 };
  }
};

const BoutiqueAvis = mongoose.model("BoutiqueAvis", boutiqueAvisSchema);

module.exports = BoutiqueAvis;
