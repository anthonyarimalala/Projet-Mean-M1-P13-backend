const mongoose = require("mongoose");

const AnnonceCommentaireSchema = new mongoose.Schema(
  {
    contenu: {
      type: String,
      required: true,
      trim: true,
    },

    auteur: {
      user_id: {
        type: String,
        required: true,
      },
      nom: {
        type: String,
        required: true,
      },
      prenom: {
        type: String,
        required: true,
      },
    },

    annonce_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Annonce",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

module.exports = mongoose.model("AnnonceCommentaire", AnnonceCommentaireSchema);
